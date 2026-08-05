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
// Specific / Static Routes (Must come BEFORE dynamic /:id parameter routes)
// -----------------------------------------------------------------------------
teacherRouter
  .route("/me")
  .all(protect, authorize(Role.Teacher))
  .get(getMyTeacherProfile)
  .patch(validate(updateTeacherFieldsSchema), updateTeacher)
  .delete(deleteTeacher);

// -----------------------------------------------------------------------------
// Public & Generic Routes
// -----------------------------------------------------------------------------
teacherRouter.route("/").get(getAllTeachers);

// Dynamic parameter route captures everything else at the end
teacherRouter.route("/:id").get(getOneTeacher);
