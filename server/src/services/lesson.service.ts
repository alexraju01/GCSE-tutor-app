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

  const where = {
    ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    ...(status && { status }),
    ...(subject && { subject }),
    ...(dateRange && { startTime: dateRange }),
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
  }));

  return { lessons, totalResults };
};

export const cancelLesson = async (
  lessonId: string,
  canceller: { userId: string; role: typeof Role.Student | typeof Role.Teacher },
) => {
  const lesson = await prisma.lesson.findUnique({
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

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: LessonStatus.Cancelled },
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
