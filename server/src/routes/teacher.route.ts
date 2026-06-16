import {
  getAllTeachers,
  getOneTeacher,
  updateTeacher,
  deleteTeacher,
} from "@controllers/teacher.controller.js";
import { protect, authorize } from "@middleware";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { updateTeacherFieldsSchema } from "../schemas/teacher.schema.js";

export const teacherRouter = Router();

teacherRouter.route("/").get(getAllTeachers);
teacherRouter.route("/:id").get(getOneTeacher);

teacherRouter
  .route("/me")
  .patch(protect, authorize("TEACHER"), validate(updateTeacherFieldsSchema), updateTeacher)
  .delete(protect, authorize("TEACHER"), deleteTeacher); // 👈 Added safely here
