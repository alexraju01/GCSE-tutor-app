import { LessonStatus, Subject } from "@generated/client.js";
import * as lessonService from "../services/lesson.service.js";
import { AppError } from "../utils/AppError.js";
import type { Request, Response } from "express";

export const getAllLessons = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;

  if (role !== "Student" && role !== "Teacher") {
    throw new AppError("Invalid user role for retrieving lessons.", 400);
  }

  // Rely on middleware-validated query params
  const { page = 1, limit = 10, status, subject } = req.query;

  const { lessons, totalResults } = await lessonService.findLessonsByRole({
    userId,
    role,
    page: Number(page),
    limit: Number(limit),
    status: status as LessonStatus,
    subject: subject as Subject,
  });

  const totalPages = Math.ceil(totalResults / Number(limit)) || 1;

  return res.status(200).json({
    status: "success",
    results: lessons.length,
    data: lessons,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalResults,
      totalPages,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
    },
  });
};
