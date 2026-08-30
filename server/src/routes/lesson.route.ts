import { getAllLessons } from "@controllers/lesson.controller.js";
import { Role } from "@generated/enums.js";
import { authorize, protect, validate } from "@middleware";
import { Router } from "express";
import { getLessonsQuerySchema } from "../schemas/lesson.schema.js";

export const lessonRouter = Router();

// Protect all lesson routes
lessonRouter.use(protect);

lessonRouter
  .route("/")
  .get(validate(getLessonsQuerySchema, "query"), getAllLessons)
  .post(authorize(Role.Student));

lessonRouter.route("/:lessonId").delete(authorize(Role.Student));
