import { LessonStatus } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";

import type { Request, Response, NextFunction } from "express";

const formatDateLabel = (startTime: Date): string => {
  return startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTimeSlot = (startTime: Date, durationMinutes: number): string => {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const startFormatted = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endFormatted = endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${startFormatted} - ${endFormatted}`;
};

const formatDurationLabel = (durationMinutes: number): string => {
  const hours = durationMinutes / 60;
  return hours === 1 ? "1 hr" : `${hours} hrs`;
};

const formatSessionTime = (startTime: Date, durationMinutes: number): string => {
  const isToday = startTime.toDateString() === new Date().toDateString();
  const dayLabel = isToday ? "Today" : formatDateLabel(startTime);
  const slot = formatTimeSlot(startTime, durationMinutes);

  return `${dayLabel}, ${slot}`;
};

export const getTeacherDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return next(new AppError("Unauthorized.", 401));
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true, totalEarnings: true, totalHours: true },
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
      upcomingBookings,
      pendingRequests,
    },
  });
};
