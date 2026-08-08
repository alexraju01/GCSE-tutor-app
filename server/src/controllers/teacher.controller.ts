// src/controllers/teacher.controller.ts
import { AppError } from "@utils/AppError.js";
import { teacherService } from "../services/teacher.service.js";
import type { Request, Response, NextFunction } from "express";

export const getAllTeachers = async (_req: Request, res: Response) => {
  const teachers = await teacherService.findAll();
  res.status(200).json({ status: "success", results: teachers.length, data: teachers });
};

export const getOneTeacher = async (req: Request<{ id: string }>, res: Response) => {
  const teacher = await teacherService.findById(req.params.id);
  res.status(200).json({ status: "success", data: teacher });
};

export const getMyTeacherProfile = async (req: Request, res: Response, next: NextFunction) => {
  const teacher = await teacherService.findByUserId(req.user.id);
  if (!teacher) return next(new AppError("Teacher profile not found for this user account.", 404));
  res.status(200).json({ status: "success", data: teacher });
};

export const updateTeacher = async (req: Request, res: Response) => {
  const teacher = await teacherService.updateByUserId(req.user.id, req.body);
  res.status(200).json({ status: "success", data: teacher });
};

export const deleteTeacher = async (req: Request, res: Response) => {
  await teacherService.deleteByUserId(req.user.id);
  res.status(204).json({ status: "success", data: null });
};
