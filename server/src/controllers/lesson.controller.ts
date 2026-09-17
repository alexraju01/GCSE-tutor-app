import { Role } from "@generated/client.js";
import { formatPagination } from "@utils/pagination.js";
import * as lessonService from "../services/lesson.service.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateLessonInput,
  GetLessonsQuery,
  LessonBookingItem,
} from "../schemas/lesson.schema.js";
import type { Request, Response } from "express";

export const getAllLessons = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;

  if (role !== Role.Student && role !== Role.Teacher) {
    throw new AppError("Invalid user role for retrieving lessons.", 400);
  }

  // Already validated + defaulted by the getLessonsQuerySchema middleware.
  const { page, limit, status, subject, year, month, sort } =
    req.query as unknown as GetLessonsQuery;

  const { lessons, totalResults } = await lessonService.findLessonsByRole({
    userId,
    role,
    page,
    limit,
    status,
    subject,
    year,
    month,
    sort,
  });

  return res.status(200).json({
    status: "success",
    results: lessons.length,
    data: lessons,
    pagination: formatPagination(totalResults, page, limit),
  });
};

export const cancelLesson = async (req: Request<{ lessonId: string }>, res: Response) => {
  const { id: userId, role } = req.user;

  // Role is already enforced by authorize(Role.Student, Role.Teacher) on this route.
  await lessonService.cancelLesson(req.params.lessonId, {
    userId,
    role: role as typeof Role.Student | typeof Role.Teacher,
  });

  // 204 needs an empty body
  res.status(204).send();
};

export const createLesson = async (req: Request, res: Response) => {
  // Role is already enforced by authorize(Role.Student) on this route.
  const input = req.body as CreateLessonInput;
  const isBatch = Array.isArray(input);
  const items: LessonBookingItem[] = isBatch ? input : [input];

  const lessons = await lessonService.createLessonBookings(
    req.user.id,
    items.map(({ teacherProfileId, availabilityId, subject, topic, notes }) => ({
      teacherId: teacherProfileId,
      availabilityId,
      subject,
      topic,
      notes,
    })),
  );

  return res.status(201).json({
    status: "success",
    data: isBatch ? lessons : lessons[0],
  });
};
