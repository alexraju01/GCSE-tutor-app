import { randomUUID } from "node:crypto";
import { prisma } from "@db/prisma.js";
import { LessonStatus, Prisma } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { formatSessionTime } from "@utils/date.js";
import {
  bookableWindow,
  isAllowedLessonDuration,
  LESSON_DURATION_MESSAGE,
  LIVE_STATUSES,
  type BookingPolicy,
} from "./booking.policy.js";
import {
  DAY_MS,
  expandRecurringPattern,
  MAX_RECURRING_SLOTS,
  type RecurringPattern,
} from "./recurrence.js";

// overlaps are blocked by the availabilities_no_overlap constraint, so no need
// for serializable here. the checks below are just for nicer error messages

export const requireTeacherId = async (userId?: string): Promise<string> => {
  if (!userId) throw new AppError("Unauthorized.", 401);

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!teacher) {
    throw new AppError("Access denied. Only registered tutors can manage availability.", 403);
  }

  return teacher.id;
};

// lets these run inside a transaction too, not just against the top-level client
type Db = Prisma.TransactionClient;

export const checkOverlap = async (
  db: Db,
  teacherId: string,
  startTime: Date,
  endTime: Date,
  excludeAvailabilityId?: string,
): Promise<void> => {
  const overlap = await db.availability.findFirst({
    where: {
      teacherId,
      ...(excludeAvailabilityId && { id: { not: excludeAvailabilityId } }),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  if (overlap) {
    throw new AppError(
      "This time slot overlaps with an availability block you've already scheduled.",
      409,
    );
  }
};

// block reschedule/delete while a slot has a live booking on it - moving it
// would desync the lesson's startTime, deleting it would unlink the booking
const assertNoActiveLesson = async (db: Db, availabilityId: string, action: string) => {
  const activeLesson = await db.lesson.findFirst({
    where: { availabilityId, status: { in: LIVE_STATUSES } },
    select: { id: true },
  });

  if (activeLesson) {
    throw new AppError(
      `Cannot ${action} this slot — it has an active booking. Cancel the lesson first.`,
      409,
    );
  }
};

export interface AvailabilitySlot {
  startTime: Date;
  durationInMinutes: number;
}

// Creates one or many slots atomically — either the whole batch is created,
// or none of it is, so a rejected slot can't leave a partial week behind.
export const createAvailabilities = async (teacherId: string, slots: AvailabilitySlot[]) => {
  const now = new Date();
  const isBatch = slots.length > 1;

  const ranges = slots.map(({ startTime, durationInMinutes }, index) => {
    const label = formatSessionTime(startTime, durationInMinutes);

    if (!isAllowedLessonDuration(durationInMinutes)) {
      const prefix = isBatch ? `Slot ${index + 1} of ${slots.length}: ` : "";
      throw new AppError(`${prefix}${LESSON_DURATION_MESSAGE}`, 400);
    }

    if (startTime < now) {
      const prefix = isBatch ? `Slot ${index + 1} of ${slots.length} (${label}): ` : "";
      throw new AppError(
        `${prefix}Cannot create availability in the past. Please select a future time.`,
        400,
      );
    }

    return {
      startTime,
      endTime: new Date(startTime.getTime() + durationInMinutes * 60 * 1000),
      label,
    };
  });

  // Reject overlaps within the batch itself before touching the database.
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (ranges[i].startTime < ranges[j].endTime && ranges[j].startTime < ranges[i].endTime) {
        throw new AppError(
          `Slot ${i + 1} (${ranges[i].label}) overlaps with slot ${j + 1} (${ranges[j].label}).`,
          400,
        );
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const created = [];
    for (let i = 0; i < ranges.length; i++) {
      const { startTime, endTime, label } = ranges[i];

      try {
        await checkOverlap(tx, teacherId, startTime, endTime);
      } catch (err) {
        if (err instanceof AppError && isBatch) {
          throw new AppError(
            `Slot ${i + 1} of ${ranges.length} (${label}): ${err.message}`,
            err.statusCode,
          );
        }
        throw err;
      }

      created.push(await tx.availability.create({ data: { teacherId, startTime, endTime } }));
    }
    return created;
  });
};

// creates a weekly pattern in one go under one seriesId. clashing slots are
// skipped rather than failing everything, so re-running a pattern fills gaps
export const createRecurringAvailabilities = async (
  teacherId: string,
  pattern: RecurringPattern,
) => {
  if (!isAllowedLessonDuration(pattern.lessonLength)) {
    throw new AppError(LESSON_DURATION_MESSAGE, 400);
  }

  const slots = expandRecurringPattern(pattern);

  if (slots.length === 0) {
    throw new AppError("No upcoming slots match these settings.", 400);
  }
  if (slots.length > MAX_RECURRING_SLOTS) {
    throw new AppError(
      `That's ${slots.length} slots — please keep it to ${MAX_RECURRING_SLOTS} or fewer.`,
      400,
    );
  }

  const seriesId = randomUUID();

  return prisma.$transaction(async (tx) => {
    // One query for every existing slot in the pattern's span, instead of
    // an overlap check per slot.
    const existing = await tx.availability.findMany({
      where: {
        teacherId,
        startTime: { lt: slots[slots.length - 1].endTime },
        endTime: { gt: slots[0].startTime },
      },
      select: { startTime: true, endTime: true },
    });

    const toCreate = slots.filter(
      (slot) =>
        !existing.some((other) => other.startTime < slot.endTime && other.endTime > slot.startTime),
    );
    const skipped = slots.filter((slot) => !toCreate.includes(slot)).map((slot) => slot.key);

    if (toCreate.length === 0) {
      throw new AppError(
        "Every slot in this pattern overlaps availability you've already scheduled.",
        409,
      );
    }

    const created = await tx.availability.createManyAndReturn({
      data: toCreate.map(({ startTime, endTime }) => ({ teacherId, startTime, endTime, seriesId })),
    });

    created.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return { created, skipped, seriesId };
  });
};

interface UpdateAvailabilityParams {
  teacherId: string;
  availabilityId: string;
  startIsoString?: string;
  durationInMinutes?: number;
}

export const updateAvailabilityForTeacher = async ({
  teacherId,
  availabilityId,
  startIsoString,
  durationInMinutes,
}: UpdateAvailabilityParams) => {
  if (!startIsoString && durationInMinutes === undefined) {
    throw new AppError("Please provide at least one field to update.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.availability.findFirst({
      where: { id: availabilityId, teacherId },
      select: { startTime: true, endTime: true },
    });

    if (!existing) {
      throw new AppError("Availability record not found or access denied.", 404);
    }

    await assertNoActiveLesson(tx, availabilityId, "reschedule");

    const startTime = startIsoString ? new Date(startIsoString) : existing.startTime;
    if (startIsoString && startTime < new Date()) {
      throw new AppError("Cannot schedule availability in the past.", 400);
    }

    const currentDuration = (existing.endTime.getTime() - existing.startTime.getTime()) / 60000;
    const finalDuration = durationInMinutes !== undefined ? durationInMinutes : currentDuration;
    if (!isAllowedLessonDuration(finalDuration)) {
      throw new AppError(LESSON_DURATION_MESSAGE, 400);
    }
    const endTime = new Date(startTime.getTime() + finalDuration * 60000);

    await checkOverlap(tx, teacherId, startTime, endTime, availabilityId);

    // edited slot no longer follows the pattern, take it out of the series
    return tx.availability.update({
      where: { id: availabilityId },
      data: { startTime, endTime, seriesId: null },
    });
  });
};

// Deletes one or many slots atomically — either every slot in the batch is
// removed, or none of it is, so a slot with an active booking can't leave a
// partially-cleared selection behind (mirrors createAvailabilities).
export const deleteAvailabilitiesForTeacher = (teacherId: string, availabilityIds: string[]) => {
  const isBatch = availabilityIds.length > 1;

  return prisma.$transaction(async (tx) => {
    for (let i = 0; i < availabilityIds.length; i++) {
      const availabilityId = availabilityIds[i];
      const prefix = isBatch ? `Slot ${i + 1} of ${availabilityIds.length}: ` : "";

      const existing = await tx.availability.findFirst({
        where: { id: availabilityId, teacherId },
        select: { startTime: true, endTime: true },
      });

      if (!existing) {
        throw new AppError(`${prefix}Availability record not found or access denied.`, 404);
      }

      try {
        await assertNoActiveLesson(tx, availabilityId, "delete");
      } catch (err) {
        if (err instanceof AppError && isBatch) {
          const durationInMinutes =
            (existing.endTime.getTime() - existing.startTime.getTime()) / 60000;
          const label = formatSessionTime(existing.startTime, durationInMinutes);
          throw new AppError(`${prefix}(${label}) ${err.message}`, err.statusCode);
        }
        throw err;
      }

      await tx.availability.delete({ where: { id: availabilityId } });
    }
  });
};

// removes the upcoming unbooked slots in a series. booked ones are kept and
// returned so the teacher knows which lessons still need sorting
export const deleteSeriesForTeacher = async (teacherId: string, seriesId: string) => {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const seriesSlots = await tx.availability.findMany({
      where: { teacherId, seriesId, startTime: { gt: now } },
      select: {
        id: true,
        startTime: true,
        lessons: { where: { status: { in: LIVE_STATUSES } }, select: { id: true }, take: 1 },
      },
    });

    if (seriesSlots.length === 0) {
      throw new AppError("No upcoming slots found for that series.", 404);
    }

    const removable = seriesSlots.filter((slot) => slot.lessons.length === 0).map((s) => s.id);
    const keptBooked = seriesSlots.filter((slot) => slot.lessons.length > 0).map((s) => s.id);

    if (removable.length > 0) {
      await tx.availability.deleteMany({ where: { id: { in: removable } } });
    }

    return { deleted: removable, keptBooked };
  });
};

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

// calendars fetch by date range - paging by count was hiding slots past page 1
const MAX_RANGE_DAYS = 120;
const MAX_RANGE_RESULTS = 1000;

export interface AvailabilityRange {
  from: Date;
  to: Date;
}

export const assertValidRange = ({ from, to }: AvailabilityRange) => {
  if (to <= from) throw new AppError("'to' must be after 'from'.", 400);
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    throw new AppError(`Please request at most ${MAX_RANGE_DAYS} days at a time.`, 400);
  }
};

const POLICY_SELECT = {
  minNoticeHours: true,
  maxAdvanceDays: true,
  cancellationCutoffHours: true,
  requireApproval: true,
} as const;

// student view: unbooked slots inside the tutor's notice/advance window,
// plus the policy so the ui can show it
export const findBookableAvailabilities = async (teacherId: string, range: AvailabilityRange) => {
  assertValidRange(range);

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: POLICY_SELECT,
  });
  if (!teacher) throw new AppError("No teacher found with that ID.", 404);

  const policy: BookingPolicy = teacher;
  const window = bookableWindow(policy);
  const from = range.from > window.earliest ? range.from : window.earliest;
  const to = range.to < window.latest ? range.to : window.latest;

  const availabilities =
    from >= to
      ? []
      : await prisma.availability.findMany({
          where: {
            teacherId,
            startTime: { gte: from, lt: to },
            lessons: { none: { status: { in: LIVE_STATUSES } } },
          },
          orderBy: { startTime: "asc" },
          take: MAX_RANGE_RESULTS,
          select: { id: true, teacherId: true, startTime: true, endTime: true },
        });

  return {
    availabilities,
    policy: teacher,
    bookableWindow: { from: window.earliest, to: window.latest },
  };
};

// teacher view: every slot in the range + who booked it
export const findOwnAvailabilitiesInRange = async (teacherId: string, range: AvailabilityRange) => {
  assertValidRange(range);

  const availabilities = await prisma.availability.findMany({
    where: {
      teacherId,
      startTime: { lt: range.to },
      endTime: { gt: range.from },
    },
    orderBy: { startTime: "asc" },
    take: MAX_RANGE_RESULTS,
    select: {
      id: true,
      teacherId: true,
      startTime: true,
      endTime: true,
      seriesId: true,
      lessons: {
        where: { status: { in: [...LIVE_STATUSES, LessonStatus.Completed] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          subject: true,
          topic: true,
          student: { select: { user: { select: { name: true, image: true } } } },
        },
      },
    },
  });

  return availabilities.map(({ lessons, ...slot }) => {
    const lesson = lessons[0];
    return {
      ...slot,
      isBooked: Boolean(lesson),
      lesson: lesson
        ? {
            id: lesson.id,
            status: lesson.status,
            subject: lesson.subject,
            topic: lesson.topic,
            studentName: lesson.student.user.name,
            studentImage: lesson.student.user.image,
          }
        : null,
    };
  });
};

interface FindAvailabilitiesParams {
  teacherId: string;
  skip: number;
  limit: number;
  onlyUnbooked?: boolean;
}

// old paginated version, kept so existing callers don't break
export const findTeacherAvailabilities = async ({
  teacherId,
  skip,
  limit,
  onlyUnbooked = false,
}: FindAvailabilitiesParams) => {
  const whereCondition = {
    teacherId,
    startTime: { gte: new Date() },
    ...(onlyUnbooked && { lessons: { none: { status: { in: LIVE_STATUSES } } } }),
  };

  const [availabilities, totalResults] = await prisma.$transaction([
    prisma.availability.findMany({
      where: whereCondition,
      orderBy: { startTime: "asc" },
      skip,
      take: limit,
      include: {
        lessons: {
          where: { status: { in: LIVE_STATUSES } },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.availability.count({
      where: whereCondition,
    }),
  ]);

  return {
    availabilities: availabilities.map(({ lessons, ...availability }) => ({
      ...availability,
      isBooked: lessons.length > 0,
    })),
    totalResults,
  };
};
