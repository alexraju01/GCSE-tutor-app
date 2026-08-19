import { getAllLessons } from "@controllers/lesson.controller.js";
import { Role } from "@generated/enums.js";
import { authorize, protect } from "@middleware";
import { Router } from "express";

export const lessonRouter = Router();

// Protect all lesson routes
lessonRouter.use(protect);

lessonRouter.route("/").get(getAllLessons).post(authorize(Role.Student)); // Only students can initiate a lesson

lessonRouter.route("/:lessonId").delete(authorize(Role.Student)); // Only students can cancel their lessons here
