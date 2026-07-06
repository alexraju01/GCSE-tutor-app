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
teacherRouter
  .route("/me")
  .get(protect, authorize(Role.TEACHER), getMyTeacherProfile)
  .patch(protect, authorize(Role.TEACHER), validate(updateTeacherFieldsSchema), updateTeacher)
  .delete(protect, authorize(Role.TEACHER), deleteTeacher);

teacherRouter.route("/").get(getAllTeachers);
teacherRouter.route("/:id").get(getOneTeacher);
