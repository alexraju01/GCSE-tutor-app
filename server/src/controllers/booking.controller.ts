import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { NextFunction, Request, Response } from "express";

// 1. Reusable Select Configuration
const USER_PROFILE_SELECT = {
  select: {
    name: true,
    image: true,
    email: true,
  },
} as const;

const BASE_BOOKING_SELECT = {
  id: true,
  subject: true,
  topic: true,
  meetingRoomId: true,
  startTime: true,
  duration: true,
  status: true,
  notes: true,
} as const;

export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId, role } = req.user;

  if (role !== "Student" && role !== "Teacher") {
    return next(new AppError("Invalid user role for retrieving bookings.", 400));
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 5;
  const skip = (page - 1) * limit;

  const isStudent = role === "Student";

  // 2. Separate branches for zero type assertions or runtime re-mapping
  const [totalResults, bookings] = await Promise.all([
    prisma.booking.count({
      where: isStudent ? { student: { userId } } : { teacher: { userId } },
    }),

    isStudent
      ? prisma.booking
          .findMany({
            where: { student: { userId } },
            skip,
            take: limit,
            orderBy: { startTime: "asc" },
            select: {
              ...BASE_BOOKING_SELECT,
              teacher: {
                select: { user: USER_PROFILE_SELECT },
              },
            },
          })
          .then((rows) =>
            rows.map(({ teacher, ...booking }) => ({
              ...booking,
              teacher: teacher.user,
            })),
          )
      : prisma.booking
          .findMany({
            where: { teacher: { userId } },
            skip,
            take: limit,
            orderBy: { startTime: "asc" },
            select: {
              ...BASE_BOOKING_SELECT,
              student: {
                select: { user: USER_PROFILE_SELECT },
              },
            },
          })
          .then((rows) =>
            rows.map(({ student, ...booking }) => ({
              ...booking,
              student: student.user,
            })),
          ),
  ]);

  return res.status(200).json({
    status: "success",
    currentPage: page,
    results: bookings.length,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
    bookings,
  });
};
