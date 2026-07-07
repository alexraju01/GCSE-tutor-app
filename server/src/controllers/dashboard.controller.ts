import { BookingStatus } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type { RequestHandler } from "express";

export const getTeacherDashboard: RequestHandler = async (req, res, next) => {
  // 1. Authenticated user ID from protect middleware
  const { id: userId } = req.user;

  // 2. Locate the teacher profile associated with this user
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true, totalEarnings: true },
  });

  if (!teacher) {
    return next(new AppError("Teacher profile not found.", 404));
  }

  // 3. Run queries concurrently to gather dashboard data
  const [completedLessonsCount, activeStudentsCount, completedBookings] = await Promise.all([
    // Total number of completed lessons
    prisma.booking.count({
      where: {
        teacherId: teacher.id,
        status: BookingStatus.COMPLETED,
      },
    }),

    // Unique count of active students who have booked valid sessions
    prisma.student.count({
      where: {
        bookings: {
          some: {
            teacherId: teacher.id,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          },
        },
      },
    }),

    // Fetch intervals for completed lessons to calculate total duration
    prisma.booking.findMany({
      where: {
        teacherId: teacher.id,
        status: BookingStatus.COMPLETED,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  // 4. Calculate total hours taught from completed bookings
  const totalHoursTaught = completedBookings.reduce((total, booking) => {
    const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  // 5. Construct the clean response payload
  res.status(200).json({
    status: "success",
    data: {
      totalEarnings: teacher.totalEarnings,
      completedLessons: completedLessonsCount,
      activeStudents: activeStudentsCount,
      totalHoursTaught: Number(totalHoursTaught.toFixed(1)), // Formatted to 1 decimal place
    },
  });
};
