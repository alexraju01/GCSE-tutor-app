import { Role } from "@generated/client.js";
import { formatPagination } from "@utils/pagination.js";
import { idempotencyKeySchema } from "../schemas/lesson.schema.js";
import * as lessonService from "../services/lesson.service.js";
import { AppError } from "../utils/AppError.js";
import type {
  CancelLessonInput,
  CreateLessonInput,
  GetLessonsQuery,
  LessonBookingItem,
  RespondToLessonInput,
} from "../schemas/lesson.schema.js";
import type { Request, Response } from "express";

export const getAllLessons = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;

  if (role !== Role.Student && role !== Role.Teacher) {
    throw new AppError("Invalid user role for retrieving lessons.", 400);
  }

  // Already validated + defaulted by the getLessonsQuerySchema middleware.
  const { page, limit, status, subject, year, month, sort, scope } =
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
    scope,
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
  const { reason, reopenSlot } = (req.body ?? {}) as CancelLessonInput;

  // Role is already enforced by authorize(Role.Student, Role.Teacher) on this route.
  await lessonService.cancelLesson(
    req.params.lessonId,
    { userId, role: role as typeof Role.Student | typeof Role.Teacher },
    { reason, reopenSlot },
  );

  // 204 needs an empty body
  res.status(204).send();
};

export const respondToLesson = async (req: Request<{ lessonId: string }>, res: Response) => {
  const { decision, reason } = req.body as RespondToLessonInput;

  await lessonService.respondToLessonRequest(req.params.lessonId, req.user.id, decision, reason);

  res.status(204).send();
};

export const createLesson = async (req: Request, res: Response) => {
  // Role is already enforced by authorize(Role.Student) on this route.
  const input = req.body as CreateLessonInput;
  const isBatch = Array.isArray(input);
  const items: LessonBookingItem[] = isBatch ? input : [input];

  const idempotencyKey = idempotencyKeySchema.parse(req.get("Idempotency-Key"));

  const { lessons, replayed } = await lessonService.createLessonBookings(
    req.user.id,
    items.map(({ teacherProfileId, availabilityId, subject, topic, notes }) => ({
      teacherId: teacherProfileId,
      availabilityId,
      subject,
      topic,
      notes,
    })),
    idempotencyKey,
  );

  // 200 for a replayed request since nothing new was created
  return res.status(replayed ? 200 : 201).json({
    status: "success",
    data: isBatch ? lessons : lessons[0],
  });
};
