import { getTeacherAvailabilities } from "@controllers/availability.controller.js";
import {
  getAllTeachers,
  getOneTeacher,
  updateTeacher,
  deleteTeacher,
  getMyTeacherProfile,
} from "@controllers/teacher.controller.js";
import { Role } from "@generated/enums.js";
import { protect, authorize } from "@middleware";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { updateTeacherFieldsSchema } from "../schemas/teacher.schema.js";

export const teacherRouter = Router();

// -----------------------------------------------------------------------------
// 1. Authenticated / Specific Static Routes
// -----------------------------------------------------------------------------
teacherRouter
  .route("/me")
  .all(protect, authorize(Role.Teacher))
  .get(getMyTeacherProfile)
  .patch(validate(updateTeacherFieldsSchema), updateTeacher)
  .delete(deleteTeacher);

// -----------------------------------------------------------------------------
// 2. Public Collection Routes
// -----------------------------------------------------------------------------
teacherRouter.route("/").get(getAllTeachers);

// -----------------------------------------------------------------------------
// 3. Sub-resource Routes (Must come BEFORE pure dynamic /:id routes) Public Routes for teacher availabilities
// -----------------------------------------------------------------------------
teacherRouter.get("/:teacherId/availabilities", getTeacherAvailabilities);

// -----------------------------------------------------------------------------
// 4. Pure Dynamic Parameter Routes (Catch-all for single resource lookup)
// -----------------------------------------------------------------------------
teacherRouter.route("/:id").get(getOneTeacher);
