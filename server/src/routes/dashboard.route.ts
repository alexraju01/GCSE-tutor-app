import { getTeacherDashboard, getStudentDashboard } from "@controllers/dashboard.controller.js";
import { Role } from "@generated/enums.js";
import { protect, authorize } from "@middleware";
import { Router } from "express";

export const dashboardRouter = Router();

/**
 * TEACHER DASHBOARD
 * GET /api/dashboards/teacher
 */
dashboardRouter.get("/teacher", protect, authorize(Role.Teacher), getTeacherDashboard);

/**
 * STUDENT DASHBOARD
 * GET /api/dashboards/student
 */
dashboardRouter.get(
  "/student",
  protect, // 1. Verifies the JWT and sets req.user
  authorize(Role.Student), // 2. Blocks the request if user.role !== 'STUDENT'
  getStudentDashboard, // 3. Executes database query and returns data
);
