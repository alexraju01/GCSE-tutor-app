import { getAllStudents } from "@controllers/student.controller.js";
import { Router } from "express";

export const studentRouter = Router();

studentRouter.route("/").get(getAllStudents);
