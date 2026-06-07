import { getAllTeachers } from "@controllers/teacher.controller.js";
import { Router } from "express";

export const teacherRouter = Router();

teacherRouter.route("/").get(getAllTeachers);
