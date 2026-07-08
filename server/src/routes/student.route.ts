import { deleteStudent, getAllStudents, getOneStudent } from "@controllers/student.controller.js";
import { Role } from "@generated/enums.js";
import { authorize } from "@middleware/authorize.js";
import { protect } from "@middleware/protect.js";
import { Router } from "express";

export const studentRouter = Router();

studentRouter.route("/").get(getAllStudents);
studentRouter.route("/:id").get(protect, getOneStudent);

studentRouter.route("/me").delete(protect, authorize(Role.Student), deleteStudent);
