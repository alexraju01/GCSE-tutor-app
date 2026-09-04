import { getTeacherDashboard, getStudentDashboard } from "@controllers/dashboard.controller.js";
import { Role } from "@generated/enums.js";
import { protect, authorize } from "@middleware";
import { Router } from "express";

export const dashboardRouter = Router();

/**
 * TEACHER DASHBOARD
 * GET /api/dashboard/teacher
 */
dashboardRouter.get("/teacher", protect, authorize(Role.Teacher), getTeacherDashboard);

/**
 * STUDENT DASHBOARD
 * GET /api/dashboard/student
 */
dashboardRouter.get("/student", protect, authorize(Role.Student), getStudentDashboard);
