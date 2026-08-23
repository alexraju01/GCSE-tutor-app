import { LessonStatus, Subject } from "@generated/enums.js";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { NextFunction, Request, Response } from "express";

const createEnumTransformer = <T extends Record<string, string>>(enumObj: T, paramName: string) => {
  const allowedValues = Object.values(enumObj);
  return z
    .string()
    .toLowerCase()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;

      const matchedEnum = allowedValues.find((enumValue) => enumValue.toLowerCase() === val);

      if (!matchedEnum) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid ${paramName}. Allowed values: ${allowedValues
            .map((v) => v.toLowerCase())
            .join(", ")}`,
        });
        return z.NEVER;
      }

      return matchedEnum as T[keyof T];
    });
};

// Query Schema Validation
const GetLessonsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(5),
  status: createEnumTransformer(LessonStatus, "status"),
  subject: createEnumTransformer(Subject, "subject"),
});

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

export const getAllLessons = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId, role } = req.user;

  if (role !== "Student" && role !== "Teacher") {
    return next(new AppError("Invalid user role for retrieving lessons.", 400));
  }

  // Parse & validate query parameters
  const queryResult = GetLessonsQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    const issue = queryResult.error.issues[0];
    return next(new AppError(issue?.message || "Invalid query parameters provided.", 400));
  }

  const { page, limit, status, subject } = queryResult.data;
  const skip = (page - 1) * limit;

  const isStudent = role === "Student";

  // Dynamic Prisma Where Clause (Incorporates Role, Status, and Subject Filters)
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
      orderBy: [{ startTime: "asc" }, { id: "asc" }], // Tie-breaker for stable pagination
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

  // Clean payload formatting (exposes counterpart user based on current role)
  const bookings = rawLessons.map(({ teacher, student, ...booking }) => ({
    ...booking,
    counterpart: isStudent ? teacher.user : student.user,
  }));

  const totalPages = Math.ceil(totalResults / limit);

  return res.status(200).json({
    status: "success",
    data: bookings,
    meta: {
      currentPage: page,
      limit,
      results: bookings.length,
      totalResults,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};
