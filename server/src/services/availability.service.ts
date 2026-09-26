import { prisma } from "@db/prisma.js";
import { LessonStatus, Prisma } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { formatSessionTime, ukWallClockToDate } from "@utils/date.js";

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
// would desync the lesson's startTime, deleting it cascades and wipes the
// lesson row entirely
const assertNoActiveLesson = async (db: Db, availabilityId: string, action: string) => {
  const activeLesson = await db.lesson.findFirst({
    where: { availabilityId, status: { not: LessonStatus.Cancelled } },
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
  // This loop only ever runs with 2+ slots, so both sides always get an index.
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

  return prisma.$transaction(
    async (tx) => {
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
    },
    // serializable so two overlapping creates can't both sneak past the check
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export interface RecurringPattern {
  days: number[]; // 0 = Monday … 6 = Sunday
  startDate: string; // UK "YYYY-MM-DD"
  from: string; // UK "HH:mm"
  to: string; // UK "HH:mm"
  lessonLength: number;
  weeks: number;
  exclude?: string[]; // "YYYY-MM-DD|HH:mm"
}

const MAX_RECURRING_SLOTS = 200;
const DAY_MS = 86_400_000;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toHHMM = (totalMinutes: number): string =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;

// Expands a weekly pattern into concrete future slots (UK wall-clock → real
// instants), splitting each day's window into back-to-back lessons.
const expandRecurringPattern = (pattern: RecurringPattern) => {
  const [year, month, day] = pattern.startDate.split("-").map(Number);
  const startMs = Date.UTC(year, month - 1, day);
  const startDayIndex = (new Date(startMs).getUTCDay() + 6) % 7;
  const mondayMs = startMs - startDayIndex * DAY_MS;
  const fromMinutes = toMinutes(pattern.from);
  const toMinutesValue = toMinutes(pattern.to);
  const excluded = new Set(pattern.exclude ?? []);
  const now = new Date();
  const days = [...pattern.days].sort((a, b) => a - b);

  const slots: { key: string; startTime: Date; endTime: Date }[] = [];

  for (let week = 0; week < pattern.weeks; week++) {
    for (const dayIndex of days) {
      const dateMs = mondayMs + (week * 7 + dayIndex) * DAY_MS;
      if (dateMs < startMs) continue;

      const date = new Date(dateMs);
      const dateKey = date.toISOString().slice(0, 10);

      for (
        let start = fromMinutes;
        start + pattern.lessonLength <= toMinutesValue;
        start += pattern.lessonLength
      ) {
        const key = `${dateKey}|${toHHMM(start)}`;
        if (excluded.has(key)) continue;

        const startTime = ukWallClockToDate(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
          Math.floor(start / 60),
          start % 60,
        );
        if (startTime <= now) continue;

        slots.push({
          key,
          startTime,
          endTime: new Date(startTime.getTime() + pattern.lessonLength * 60_000),
        });
      }
    }
  }

  return slots;
};

// Creates a whole weekly pattern in one transaction. Unlike createAvailabilities,
// slots that clash with availability the teacher already has are skipped rather
// than failing the batch — re-running a pattern over an existing week should
// just fill the gaps.
export const createRecurringAvailabilities = async (
  teacherId: string,
  pattern: RecurringPattern,
) => {
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

  return prisma.$transaction(
    async (tx) => {
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
          !existing.some(
            (other) => other.startTime < slot.endTime && other.endTime > slot.startTime,
          ),
      );
      const skipped = slots.filter((slot) => !toCreate.includes(slot)).map((slot) => slot.key);

      if (toCreate.length === 0) {
        throw new AppError(
          "Every slot in this pattern overlaps availability you've already scheduled.",
          409,
        );
      }

      const created = await tx.availability.createManyAndReturn({
        data: toCreate.map(({ startTime, endTime }) => ({ teacherId, startTime, endTime })),
      });

      created.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      return { created, skipped };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
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

  return prisma.$transaction(
    async (tx) => {
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
      const endTime = new Date(startTime.getTime() + finalDuration * 60000);

      await checkOverlap(tx, teacherId, startTime, endTime, availabilityId);

      return tx.availability.update({
        where: { id: availabilityId },
        data: { startTime, endTime },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
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

interface FindAvailabilitiesParams {
  teacherId: string;
  skip: number;
  limit: number;
  onlyUnbooked?: boolean;
}

export const findTeacherAvailabilities = async ({
  teacherId,
  skip,
  limit,
  onlyUnbooked = false,
}: FindAvailabilitiesParams) => {
  const whereCondition = {
    teacherId,
    startTime: { gte: new Date() },
    // A cancelled lesson shouldn't keep its slot permanently locked as "booked".
    ...(onlyUnbooked && { lessons: { none: { status: { not: LessonStatus.Cancelled } } } }),
  };

  const [availabilities, totalResults] = await prisma.$transaction([
    prisma.availability.findMany({
      where: whereCondition,
      orderBy: { startTime: "asc" },
      skip,
      take: limit,
      // Only needed to derive isBooked below — onlyUnbooked callers already
      // exclude booked slots, so this is always empty for them.
      include: {
        lessons: {
          where: { status: { not: LessonStatus.Cancelled } },
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
