import {
  getAllTeachers,
  getOneTeacher,
  updateTeacher,
  deleteTeacher,
} from "@controllers/teacher.controller.js";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { updateTeacherFieldsSchema } from "../schemas/teacher.schema.js";

export const teacherRouter = Router();

teacherRouter.route("/").get(getAllTeachers);
teacherRouter
  .route("/:id")
  .get(getOneTeacher)
  .patch(validate(updateTeacherFieldsSchema), updateTeacher)
  .delete(deleteTeacher);
