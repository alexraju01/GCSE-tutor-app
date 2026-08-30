import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { GetLessonsQuery } from "../schemas/lesson.schema.js";
import type { Request, Response } from "express";

// Reusable Select Blocks
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

export const getAllLessons = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;

  if (role !== "Student" && role !== "Teacher") {
    throw new AppError("Invalid user role for retrieving lessons.", 400);
  }

  // Extracted directly from req.query (populated by the validate middleware)
  const { page, limit, status, subject } = req.query as unknown as GetLessonsQuery;
  const skip = (page - 1) * limit;

  const isStudent = role === "Student";

  // Dynamic Prisma Where Clause
  const where = {
    ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    ...(status && { status }),
    ...(subject && { subject }),
  };

  // Parallel Database Queries
  const [totalResults, rawLessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
      select: {
        ...BASE_BOOKING_SELECT,
        teacher: {
          select: { user: USER_PROFILE_SELECT },
        },
        student: {
          select: { user: USER_PROFILE_SELECT },
        },
      },
    }),
  ]);

  // Format payload: dynamically attaches `teacher` for students or `student` for teachers
  const bookings = rawLessons.map(({ teacher, student, ...booking }) => ({
    ...booking,
    ...(isStudent ? { teacher: teacher.user } : { student: student.user }),
  }));

  const totalPages = Math.ceil(totalResults / limit);

  return res.status(200).json({
    status: "success",
    results: bookings.length,
    data: bookings,
    currentPage: page,
    limit,
    totalResults,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
};
