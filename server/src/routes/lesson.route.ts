import { getAllLessons } from "@controllers/lesson.controller.js";
import { Role } from "@generated/enums.js";
import { authorize, protect } from "@middleware";
import { Router } from "express";

export const lessonRouter = Router();

// Protect all booking routes
lessonRouter.use(protect);

lessonRouter.route("/").get(getAllLessons).post(authorize(Role.Student)); // Only students can initiate a booking

lessonRouter.route("/:bookingId").delete(authorize(Role.Student)); // Only students can cancel their bookings here
