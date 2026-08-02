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
// Public Routes
// -----------------------------------------------------------------------------
teacherRouter.route("/").get(getAllTeachers);
teacherRouter.route("/:id").get(getOneTeacher);

// -----------------------------------------------------------------------------
// Protected & Authorized Routes Below
// -----------------------------------------------------------------------------
// Everything declared past this line automatically runs protect & authorize first!
teacherRouter.use(protect, authorize(Role.Teacher));

teacherRouter
  .route("/me")
  .get(getMyTeacherProfile)
  .patch(validate(updateTeacherFieldsSchema), updateTeacher)
  .delete(deleteTeacher);
