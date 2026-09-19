import { prisma } from "@db/prisma.js";
import { LessonStatus } from "@generated/client.js";
import { formatSessionTime } from "@utils/date.js";
import { effectivelyCompletedCondition } from "./lesson.service.js";

const USER_SELECT = {
  name: true,
  image: true,
} as const;

// treat Confirmed the same as Upcoming for now, nothing actually sets Confirmed yet
const UPCOMING_LESSON_STATUSES = [LessonStatus.Upcoming, LessonStatus.Confirmed];

const toHours = (totalMinutes: number | null): number =>
  Number(((totalMinutes ?? 0) / 60).toFixed(1));

export const getTeacherDashboardData = async (teacherUserId: string) => {
  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { userId: teacherUserId },
    select: {
      id: true,
      totalEarnings: true,
      teaches: { select: { id: true, subject: true, level: true } },
    },
  });

  const now = new Date();

  const [completedLessonsCount, activeStudentsCount, durationAggregate, upcomingLessonsRaw] =
    await Promise.all([
      prisma.lesson.count({
        where: { teacherId: teacher.id, ...effectivelyCompletedCondition(now) },
      }),

      prisma.student.count({
        where: {
          lessons: { some: { teacherId: teacher.id, ...effectivelyCompletedCondition(now) } },
        },
      }),

      prisma.lesson.aggregate({
        where: { teacherId: teacher.id, ...effectivelyCompletedCondition(now) },
        _sum: { duration: true },
      }),

      prisma.lesson.findMany({
        where: {
          teacherId: teacher.id,
          status: { in: UPCOMING_LESSON_STATUSES },
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: "asc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          topic: true,
          startTime: true,
          duration: true,
          status: true,
          student: { select: { id: true, user: { select: USER_SELECT } } },
        },
      }),
    ]);

  return {
    totalEarnings: {
      amount: Number(teacher.totalEarnings),
      currency: "GBP",
    },
    completedLessons: completedLessonsCount,
    activeStudents: activeStudentsCount,
    totalHoursTaught: toHours(durationAggregate._sum.duration),
    teaches: teacher.teaches,
    upcomingLessons: upcomingLessonsRaw.map((lesson) => ({
      id: lesson.id,
      subject: lesson.subject,
      topic: lesson.topic ?? "General Session",
      student: lesson.student?.user?.name ?? "Unknown Student",
      studentImage: lesson.student?.user?.image ?? null,
      time: formatSessionTime(lesson.startTime, lesson.duration),
      status: lesson.status,
    })),
  };
};

export const getStudentDashboardData = async (studentUserId: string) => {
  const student = await prisma.student.findUniqueOrThrow({
    where: { userId: studentUserId },
    select: {
      id: true,
      subjects: { select: { id: true, subject: true, level: true } },
    },
  });

  const now = new Date();

  const [completedLessonsCount, activeTeachersCount, durationAggregate, upcomingLessonsRaw] =
    await Promise.all([
      prisma.lesson.count({
        where: { studentId: student.id, ...effectivelyCompletedCondition(now) },
      }),

      prisma.teacher.count({
        where: {
          lessons: { some: { studentId: student.id, ...effectivelyCompletedCondition(now) } },
        },
      }),

      prisma.lesson.aggregate({
        where: { studentId: student.id, ...effectivelyCompletedCondition(now) },
        _sum: { duration: true },
      }),

      prisma.lesson.findMany({
        where: {
          studentId: student.id,
          status: { in: UPCOMING_LESSON_STATUSES },
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: "asc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          topic: true,
          startTime: true,
          duration: true,
          status: true,
          teacher: { select: { id: true, user: { select: USER_SELECT } } },
        },
      }),
    ]);

  return {
    completedLessons: completedLessonsCount,
    activeTeachers: activeTeachersCount,
    totalHoursLearned: toHours(durationAggregate._sum.duration),
    subjects: student.subjects,
    upcomingLessons: upcomingLessonsRaw.map((lesson) => ({
      id: lesson.id,
      subject: lesson.subject,
      topic: lesson.topic ?? "General Session",
      teacher: lesson.teacher?.user?.name ?? "Unknown Teacher",
      teacherImage: lesson.teacher?.user?.image ?? null,
      time: formatSessionTime(lesson.startTime, lesson.duration),
      status: lesson.status,
    })),
  };
};
