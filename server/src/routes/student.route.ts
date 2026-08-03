import {
  deleteStudent,
  getAllStudents,
  getOneStudent,
  updateStudent,
} from "@controllers/student.controller.js";
import { Role } from "@generated/enums.js";
import { authorize } from "@middleware/authorize.js";
import { protect } from "@middleware/protect.js";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { updateStudentFieldsSchema } from "../schemas/student.schema.js";

export const studentRouter = Router();

// -----------------------------------------------------------------------------
// Protected Routes — everything below requires authentication
// -----------------------------------------------------------------------------
studentRouter.use(protect);

studentRouter.route("/").get(authorize(Role.Admin, Role.Teacher), getAllStudents);
studentRouter.route("/:id").get(getOneStudent); // fine-grained check happens inside canViewStudent

studentRouter
  .route("/me")
  .patch(authorize(Role.Student), validate(updateStudentFieldsSchema), updateStudent)
  .delete(authorize(Role.Student), deleteStudent);
