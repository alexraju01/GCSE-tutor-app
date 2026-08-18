import { LessonStatus } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";

import type { Request, Response, NextFunction } from "express";

// Helper for date formatting e.g. "Fri, Aug 12"
const formatDateLabel = (startTime: Date): string => {
  return startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// Helper for time slot formatting e.g. "3:00 PM - 4:00 PM"
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

// Helper for human duration label e.g. "1 hr" or "1.5 hrs"
const formatDurationLabel = (durationMinutes: number): string => {
  const hours = durationMinutes / 60;
  return hours === 1 ? "1 hr" : `${hours} hrs`;
};

// Helper for combined upcoming session time e.g. "Aug 11, 4:00 PM - 5:00 PM"
const formatSessionTime = (startTime: Date, durationMinutes: number): string => {
  const isToday = startTime.toDateString() === new Date().toDateString();
  const dayLabel = isToday ? "Today" : formatDateLabel(startTime);
  const slot = formatTimeSlot(startTime, durationMinutes);

  return `${dayLabel}, ${slot}`;
};

export const getTeacherDashboard = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Authenticated user ID from protect middleware
  const { id: userId } = req.user;

  // 2. Locate the teacher profile
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true, totalEarnings: true },
  });

  if (!teacher) {
    return next(new AppError("Teacher profile not found.", 404));
  }

  // 3. Gather metrics, upcoming bookings, and pending requests concurrently
  const [
    completedLessonsCount,
    activeStudentsCount,
    completedBookings,
    upcomingBookingsRaw,
    pendingRequestsRaw,
  ] = await Promise.all([
    // Total completed lessons count
    prisma.lesson.count({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.COMPLETED,
      },
    }),

    // Unique active students count (confirmed or completed sessions)
    prisma.student.count({
      where: {
        lessons: {
          some: {
            teacherId: teacher.id,
            status: { in: [LessonStatus.CONFIRMED, LessonStatus.COMPLETED] },
          },
        },
      },
    }),

    // Completed lessons duration to calculate total hours taught
    prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.COMPLETED,
      },
      select: { duration: true },
    }),

    // Upcoming confirmed bookings
    prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.CONFIRMED,
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

    // Pending booking requests requiring action
    prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: LessonStatus.PENDING,
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

  // 4. Calculate total hours taught
  const totalHoursTaught = completedBookings.reduce(
    (total, booking) => total + booking.duration / 60,
    0,
  );

  // 5. Transform upcoming bookings
  const upcomingBookings = upcomingBookingsRaw.map((booking) => ({
    id: booking.id,
    subject: booking.subject,
    topic: booking.topic ?? "General Session",
    student: booking.student.user.name,
    studentImage: booking.student.user.image ?? null,
    time: formatSessionTime(booking.startTime, booking.duration),
    status: "Upcoming",
  }));

  // 6. Transform pending booking requests
  const pendingRequests = pendingRequestsRaw.map((booking) => ({
    id: booking.id,
    student: booking.student.user.name,
    studentImage: booking.student.user.image ?? null,
    subject: booking.subject,
    date: formatDateLabel(booking.startTime),
    timeSlot: formatTimeSlot(booking.startTime, booking.duration),
    duration: formatDurationLabel(booking.duration),
  }));

  // 7. Send complete JSON response payload
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
