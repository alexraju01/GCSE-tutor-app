import * as dashboardService from "../services/dashboard.service.js";
import type { Request, Response } from "express";

export const getTeacherDashboard = async (req: Request, res: Response) => {
  const data = await dashboardService.getTeacherDashboardData(req.user.id);

  res.status(200).json({
    status: "success",
    data,
  });
};

export const getStudentDashboard = async (req: Request, res: Response) => {
  const data = await dashboardService.getStudentDashboardData(req.user.id);

  res.status(200).json({
    status: "success",
    data,
  });
};
