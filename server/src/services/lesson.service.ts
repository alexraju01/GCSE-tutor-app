import { LessonStatus, Subject } from "@generated/client.js";
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
  role: "Student" | "Teacher";
}

export interface CreateLessonParams {
  studentUserId: string;
  teacherId: string;
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  subject: Subject;
  topic?: string;
  notes?: string;
}

export const findLessonsByRole = async ({
  userId,
  role,
  page,
  limit,
  status,
  subject,
}: FindLessonsParams) => {
  const isStudent = role === "Student";
  const skip = (page - 1) * limit;

  const where = {
    ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    ...(status && { status }),
    ...(subject && { subject }),
  };

  if (isStudent) {
    const [totalResults, rawLessons] = await Promise.all([
      prisma.lesson.count({ where }),
      prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ startTime: "asc" }, { id: "asc" }],
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
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
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

export const cancelLessonForStudent = async (lessonId: string, studentUserId: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, status: true, startTime: true, student: { select: { userId: true } } },
  });

  if (!lesson || lesson.student.userId !== studentUserId) {
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
  startTime,
  endTime,
  subject,
  topic,
  notes,
}: CreateLessonParams) => {
  return prisma.$transaction(async (tx) => {
    // 1. Retrieve the student record via userId relation
    const student = await tx.student.findUnique({
      where: { userId: studentUserId },
      select: { id: true },
    });

    if (!student) {
      throw new AppError("Student profile not found.", 404);
    }

    // 2. Verify availability slot matches the teacher
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

    // 5. Calculate duration in minutes
    const durationInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // 6. Create lesson record aligned with Prisma model
    const lesson = await tx.lesson.create({
      data: {
        studentId: student.id,
        teacherId,
        availabilityId,
        subject,
        topic,
        startTime,
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
  });
};
