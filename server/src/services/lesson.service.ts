import { LessonStatus, Prisma, Role, Subject } from "@generated/client.js";
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
  studentUserId: string;
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

export const createLessonBooking = async ({
  studentUserId,
  teacherId,
  availabilityId,
  subject,
  topic,
  notes,
}: CreateLessonParams) => {
  return prisma.$transaction(
    async (tx) => {
      // 1. Retrieve the student record via userId relation
      const student = await tx.student.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });

      if (!student) {
        throw new AppError("Student profile not found.", 404);
      }

      // 2. Verify availability slot matches the teacher - its startTime/endTime
      // are what we use for the lesson, never trust the client for that
      const availability = await tx.availability.findUnique({
        where: { id: availabilityId },
      });

      if (!availability) {
        throw new AppError("Availability slot not found.", 404);
      }

      if (availability.teacherId !== teacherId) {
        throw new AppError("Availability slot does not belong to the specified teacher.", 400);
      }

      // 3. Check if slot has already been booked (a cancelled lesson frees the slot back up)
      const existingBooking = await tx.lesson.findFirst({
        where: { availabilityId, status: { not: LessonStatus.Cancelled } },
        select: { id: true },
      });

      if (existingBooking) {
        throw new AppError("This availability slot has already been booked.", 409);
      }

      // 4. Verify teacher exists and teaches the requested subject
      const teacherSubject = await tx.teaches.findFirst({
        where: {
          teacherId,
          subject,
        },
        select: { id: true },
      });

      if (!teacherSubject) {
        throw new AppError("Teacher does not teach the specified subject.", 400);
      }

      // 5. Duration comes from the availability slot itself
      const durationInMinutes = Math.round(
        (availability.endTime.getTime() - availability.startTime.getTime()) / (1000 * 60),
      );

      // 6. Create lesson record aligned with Prisma model
      const lesson = await tx.lesson.create({
        data: {
          studentId: student.id,
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
    },
    // serializable so two people booking the same slot at once can't both slip
    // past step 3 - postgres kills one with a P2034, we turn that into a 409
    // in the error handler instead of letting it double-book
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};
