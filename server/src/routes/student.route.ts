import { getAllStudents, getOneStudent } from "@controllers/student.controller.js";
import { protect } from "@middleware/protect.js";
import { Router } from "express";

export const studentRouter = Router();

studentRouter.route("/").get(getAllStudents);
studentRouter.route("/:id").get(protect, getOneStudent);
