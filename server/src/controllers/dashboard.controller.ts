import { LessonStatus } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import {
  formatDateLabel,
  formatTimeSlot,
  formatDurationLabel,
  formatSessionTime,
} from "@utils/date.js";
import { prisma } from "../db/prisma.js";

import type { Request, Response, NextFunction } from "express";

export const getTeacherDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError("Unauthorized.", 401));
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      totalEarnings: true,
      totalHours: true,
      teaches: {
        select: {
          id: true,
          subject: true,
          level: true,
        },
      },
    },
  });

  if (!teacher) {
    return next(new AppError("Teacher profile not found.", 404));
  }

  const [
    completedLessonsCount,
    activeStudentsCount,
    durationAggregate,
    upcomingBookingsRaw,
    pendingRequestsRaw,
  ] = await Promise.all([
    prisma.lesson.count({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.Completed,
      },
    }),

    prisma.student.count({
      where: {
        lessons: {
          some: {
            teacherId: teacher.id,
            status: { in: [LessonStatus.Confirmed, LessonStatus.Completed] },
          },
        },
      },
    }),

    prisma.lesson.aggregate({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.Completed,
      },
      _sum: {
        duration: true,
      },
    }),

    prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.Confirmed,
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
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),

    prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.Pending,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        subject: true,
        topic: true,
        startTime: true,
        duration: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalMinutes = durationAggregate._sum.duration ?? 0;
  const totalHoursTaught = totalMinutes / 60;

  const upcomingBookings = upcomingBookingsRaw.map((booking) => ({
    id: booking.id,
    subject: booking.subject,
    topic: booking.topic ?? "General Session",
    student: booking.student?.user?.name ?? "Unknown Student",
    studentImage: booking.student?.user?.image ?? null,
    time: formatSessionTime(booking.startTime, booking.duration),
    status: "Upcoming",
  }));

  const pendingRequests = pendingRequestsRaw.map((booking) => ({
    id: booking.id,
    student: booking.student?.user?.name ?? "Unknown Student",
    studentImage: booking.student?.user?.image ?? null,
    subject: booking.subject,
    date: formatDateLabel(booking.startTime),
    timeSlot: formatTimeSlot(booking.startTime, booking.duration),
    duration: formatDurationLabel(booking.duration),
  }));

  const subjects = teacher.teaches.map((item) => ({
    id: item.id,
    subject: item.subject,
    level: item.level,
  }));

  res.status(200).json({
    status: "success",
    data: {
      totalEarnings: {
        amount: Number(teacher.totalEarnings),
        currency: "GBP",
      },
      completedLessons: completedLessonsCount,
      activeStudents: activeStudentsCount,
      totalHoursTaught: Number(totalHoursTaught.toFixed(1)),
      teaches: subjects,
      upcomingBookings,
      pendingRequests,
    },
  });
};

export const getStudentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError("Unauthorized.", 401));
  }

  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    return next(new AppError("Student profile not found.", 404));
  }

  const [
    completedLessonsCount,
    activeTeachersCount,
    durationAggregate,
    upcomingBookingsRaw,
    pendingRequestsRaw,
    recentLessonsRaw,
  ] = await Promise.all([
    prisma.lesson.count({
      where: {
        studentId: student.id,
        status: LessonStatus.Completed,
      },
    }),

    prisma.teacher.count({
      where: {
        lessons: {
          some: {
            studentId: student.id,
            status: { in: [LessonStatus.Confirmed, LessonStatus.Completed] },
          },
        },
      },
    }),

    prisma.lesson.aggregate({
      where: {
        studentId: student.id,
        status: LessonStatus.Completed,
      },
      _sum: {
        duration: true,
      },
    }),

    prisma.lesson.findMany({
      where: {
        studentId: student.id,
        status: LessonStatus.Confirmed,
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
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),

    prisma.lesson.findMany({
      where: {
        studentId: student.id,
        status: LessonStatus.Pending,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        subject: true,
        topic: true,
        startTime: true,
        duration: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),

    prisma.lesson.findMany({
      where: {
        studentId: student.id,
        status: LessonStatus.Completed,
      },
      orderBy: { startTime: "desc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        topic: true,
        startTime: true,
        duration: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalMinutes = durationAggregate._sum.duration ?? 0;
  const totalHoursLearned = totalMinutes / 60;

  const upcomingBookings = upcomingBookingsRaw.map((booking) => ({
    id: booking.id,
    subject: booking.subject,
    topic: booking.topic ?? "General Session",
    teacher: booking.teacher?.user?.name ?? "Unknown Teacher",
    teacherImage: booking.teacher?.user?.image ?? null,
    time: formatSessionTime(booking.startTime, booking.duration),
    status: "Upcoming",
  }));

  const pendingRequests = pendingRequestsRaw.map((booking) => ({
    id: booking.id,
    teacher: booking.teacher?.user?.name ?? "Unknown Teacher",
    teacherImage: booking.teacher?.user?.image ?? null,
    subject: booking.subject,
    date: formatDateLabel(booking.startTime),
    timeSlot: formatTimeSlot(booking.startTime, booking.duration),
    duration: formatDurationLabel(booking.duration),
  }));

  const recentLessons = recentLessonsRaw.map((lesson) => ({
    id: lesson.id,
    subject: lesson.subject,
    topic: lesson.topic ?? "General Session",
    teacher: lesson.teacher?.user?.name ?? "Unknown Teacher",
    teacherImage: lesson.teacher?.user?.image ?? null,
    date: formatDateLabel(lesson.startTime),
    duration: formatDurationLabel(lesson.duration),
  }));

  res.status(200).json({
    status: "success",
    data: {
      completedLessons: completedLessonsCount,
      activeTeachers: activeTeachersCount,
      totalHoursLearned: Number(totalHoursLearned.toFixed(1)),
      upcomingBookings,
      pendingRequests,
      recentLessons,
    },
  });
};
