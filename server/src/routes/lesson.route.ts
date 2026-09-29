import {
  getAllLessons,
  createLesson,
  cancelLesson,
  respondToLesson,
} from "@controllers/lesson.controller.js";
import { Role } from "@generated/enums.js";
import { authorize, protect, validate } from "@middleware";
import { Router } from "express";
import {
  getLessonsQuerySchema,
  createLessonSchema,
  cancelLessonSchema,
  respondToLessonSchema,
} from "../schemas/lesson.schema.js";

export const lessonRouter = Router();

// Protect all lesson routes
lessonRouter.use(protect);

lessonRouter
  .route("/")
  .get(validate(getLessonsQuerySchema, "query"), getAllLessons)
  .post(authorize(Role.Student), validate(createLessonSchema), createLesson);

lessonRouter
  .route("/:lessonId")
  .delete(authorize(Role.Student, Role.Teacher), validate(cancelLessonSchema), cancelLesson);

// teacher accepts/declines a pending request
lessonRouter
  .route("/:lessonId/respond")
  .patch(authorize(Role.Teacher), validate(respondToLessonSchema), respondToLesson);
