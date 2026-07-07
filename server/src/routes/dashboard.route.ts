import { getTeacherDashboard } from "@controllers/dashboard.controller.js";
import { protect, authorize } from "@middleware";
import { Router } from "express";

export const dashboardRouter = Router();

/**
 * TEACHER DASHBOARD
 * GET /api/dashboards/teacher
 */
dashboardRouter.get(
  "/teacher",
  protect, // 1. Verifies the JWT and sets req.user
  authorize("TEACHER"), // 2. Blocks the request if user.role !== 'TEACHER'
  getTeacherDashboard, // 3. Executes database query and returns data
);

/**
 * STUDENT DASHBOARD
 * GET /api/dashboards/student
 */
// dashboardRouter.get(
//   "/student",
//   protect, // 1. Verifies the JWT and sets req.user
//   authorize("STUDENT"), // 2. Blocks the request if user.role !== 'STUDENT'
//   getStudentDashboard, // 3. Executes database query and returns data
// );
