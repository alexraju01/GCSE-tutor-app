import { LessonStatus, Prisma, Role, Subject } from "@generated/client.js";
import { formatSessionTime } from "@utils/date.js";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { GetLessonsQuery } from "../schemas/lesson.schema.js";

const USER_SELECT = {
  name: true,
  image: true,
  email: true,
} as const;

const BASE_LESSON_SELECT = {
  id: true,
  subject: true,
  topic: true,
  meetingRoomId: true,
  startTime: true,
  duration: true,
  status: true,
  notes: true,
} as const;

export interface FindLessonsParams extends GetLessonsQuery {
  userId: string;
  role: typeof Role.Student | typeof Role.Teacher;
}

export interface CreateLessonParams {
  teacherId: string;
  availabilityId: string;
  subject: Subject;
  topic?: string;
  notes?: string;
}

// Builds a [gte, lt) range for the requested year, or year+month, in UTC.
// A month with no year is treated as that month in the current year, since
// "March" alone is ambiguous otherwise.
const buildDateRangeFilter = (year?: number, month?: number) => {
  if (year === undefined && month === undefined) return undefined;

  const rangeYear = year ?? new Date().getUTCFullYear();
  const startMonth = month !== undefined ? month - 1 : 0;
  const endMonth = month !== undefined ? month - 1 : 11;

  return {
    gte: new Date(Date.UTC(rangeYear, startMonth, 1)),
    lt: new Date(Date.UTC(rangeYear, endMonth + 1, 1)),
  };
};

// Nothing ever flips a lesson from Upcoming/Confirmed to Completed once its
// start time passes — there's no worker for it — so the stored status goes
// stale. Derive the real status here instead of trusting it as-is.
const getEffectiveStatus = (status: LessonStatus, startTime: Date, now: Date): LessonStatus => {
  const isPending = status === LessonStatus.Upcoming || status === LessonStatus.Confirmed;
  return isPending && startTime <= now ? LessonStatus.Completed : status;
};

// A lesson counts as completed once it's actually Completed OR its start
// time has simply passed (see getEffectiveStatus) — reused anywhere a query
// filters on `status: Completed` directly, so those don't stay stuck at
// zero for lessons no one ever flips.
export const effectivelyCompletedCondition = (now: Date = new Date()) => ({
  OR: [
    { status: LessonStatus.Completed },
    { status: { in: [LessonStatus.Upcoming, LessonStatus.Confirmed] }, startTime: { lte: now } },
  ],
});

// Keeps filtering consistent with getEffectiveStatus above — otherwise a
// lesson could display as Completed but never show up under a "Completed"
// filter (or a started-but-technically-Upcoming one could still show up
// under "Upcoming").
const buildStatusCondition = (status: LessonStatus | undefined, now: Date) => {
  if (!status) return undefined;

  if (status === LessonStatus.Completed) {
    return effectivelyCompletedCondition(now);
  }

  if (status === LessonStatus.Upcoming || status === LessonStatus.Confirmed) {
    return { status, startTime: { gt: now } };
  }

  return { status };
};

export const findLessonsByRole = async ({
  userId,
  role,
  page,
  limit,
  status,
  subject,
  year,
  month,
  sort,
}: FindLessonsParams) => {
  const isStudent = role === Role.Student;
  const skip = (page - 1) * limit;
  const dateRange = buildDateRangeFilter(year, month);
  const orderBy = [{ startTime: sort }, { id: sort }];
  const now = new Date();
  const statusCondition = buildStatusCondition(status, now);

  const where = {
    ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    ...(subject && { subject }),
    ...(dateRange && { startTime: dateRange }),
    // A separate AND entry so this never collides with dateRange's own
    // startTime key above — both need to hold at once when both are set.
    ...(statusCondition && { AND: [statusCondition] }),
  };

  if (isStudent) {
    const [totalResults, rawLessons] = await Promise.all([
      prisma.lesson.count({ where }),
      prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          ...BASE_LESSON_SELECT,
          teacher: { select: { user: { select: USER_SELECT } } },
        },
      }),
    ]);

    const lessons = rawLessons.map(({ teacher, ...lesson }) => ({
      ...lesson,
      teacher: teacher.user,
      status: getEffectiveStatus(lesson.status, lesson.startTime, now),
    }));

    return { lessons, totalResults };
  }

  const [totalResults, rawLessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        ...BASE_LESSON_SELECT,
        student: { select: { user: { select: USER_SELECT } } },
      },
    }),
  ]);

  const lessons = rawLessons.map(({ student, ...lesson }) => ({
    ...lesson,
    student: student.user,
    status: getEffectiveStatus(lesson.status, lesson.startTime, now),
  }));

  return { lessons, totalResults };
};

export const cancelLesson = async (
  lessonId: string,
  canceller: { userId: string; role: typeof Role.Student | typeof Role.Teacher },
) => {
  await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        status: true,
        startTime: true,
        student: { select: { userId: true } },
        teacher: { select: { userId: true } },
      },
    });

    const ownerUserId =
      canceller.role === Role.Student ? lesson?.student.userId : lesson?.teacher.userId;

    if (!lesson || ownerUserId !== canceller.userId) {
      throw new AppError("No lesson found with that ID.", 404);
    }

    if (lesson.status === LessonStatus.Cancelled || lesson.status === LessonStatus.Completed) {
      throw new AppError(`This lesson is already ${lesson.status.toLowerCase()}.`, 400);
    }

    if (lesson.startTime <= new Date()) {
      throw new AppError("This lesson has already started and can no longer be cancelled.", 400);
    }

    await tx.lesson.update({
      where: { id: lessonId },
      data: { status: LessonStatus.Cancelled },
    });
  });
};

// Books one lesson for an already-resolved student, inside a transaction a
// caller controls — lets createLessonBookings loop over a whole batch inside
// a single atomic transaction instead of one per lesson. itemPrefix is empty
// for a lone booking and "Lesson 2 of 3: " style for a batch, so error
// messages always point at the specific booking that failed.
const bookSingleLessonInTx = async (
  tx: Prisma.TransactionClient,
  studentId: string,
  { teacherId, availabilityId, subject, topic, notes }: CreateLessonParams,
  itemPrefix: string,
) => {
  // Verify availability slot matches the teacher - its startTime/endTime
  // are what we use for the lesson, never trust the client for that
  const availability = await tx.availability.findUnique({
    where: { id: availabilityId },
  });

  if (!availability) {
    throw new AppError(`${itemPrefix}No availability slot found with that ID.`, 404);
  }

  const durationInMinutes = Math.round(
    (availability.endTime.getTime() - availability.startTime.getTime()) / (1000 * 60),
  );
  const slotLabel = formatSessionTime(availability.startTime, durationInMinutes);

  if (availability.teacherId !== teacherId) {
    throw new AppError(
      `${itemPrefix}The ${slotLabel} slot does not belong to the specified teacher.`,
      400,
    );
  }

  // Check if slot has already been booked (a cancelled lesson frees the slot back up)
  const existingBooking = await tx.lesson.findFirst({
    where: { availabilityId, status: { not: LessonStatus.Cancelled } },
    select: { id: true },
  });

  if (existingBooking) {
    throw new AppError(`${itemPrefix}The ${slotLabel} slot has already been booked.`, 409);
  }

  // Verify teacher exists and teaches the requested subject
  const teacherSubject = await tx.teaches.findFirst({
    where: {
      teacherId,
      subject,
    },
    select: { id: true },
  });

  if (!teacherSubject) {
    throw new AppError(
      `${itemPrefix}The teacher for the ${slotLabel} slot doesn't teach ${subject}.`,
      400,
    );
  }

  const lesson = await tx.lesson.create({
    data: {
      studentId,
      teacherId,
      availabilityId,
      subject,
      topic,
      startTime: availability.startTime,
      duration: durationInMinutes,
      notes,
      status: LessonStatus.Upcoming,
    },
    select: {
      ...BASE_LESSON_SELECT,
      teacher: { select: { user: { select: USER_SELECT } } },
    },
  });

  return {
    ...lesson,
    teacher: lesson.teacher.user,
  };
};

// Books one or many lessons atomically — either every booking in the batch
// succeeds, or none do (a partially-booked "weekly slot for a month" request
// would just confuse whoever asked for all of them).
export const createLessonBookings = async (
  studentUserId: string,
  bookings: CreateLessonParams[],
) => {
  const isBatch = bookings.length > 1;

  return prisma.$transaction(
    async (tx) => {
      const student = await tx.student.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });

      if (!student) {
        throw new AppError("Student profile not found.", 404);
      }

      const lessons = [];
      for (let i = 0; i < bookings.length; i++) {
        const itemPrefix = isBatch ? `Lesson ${i + 1} of ${bookings.length}: ` : "";
        lessons.push(await bookSingleLessonInTx(tx, student.id, bookings[i], itemPrefix));
      }

      return lessons;
    },
    // serializable so two people booking the same slot at once can't both slip
    // past the existing-booking check - postgres kills one with a P2034, we
    // turn that into a 409 in the error handler instead of letting it double-book
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};
