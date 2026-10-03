// src/controllers/teacher.controller.ts
import { AppError } from "@utils/AppError.js";
import { formatPagination, getPaginationOptions } from "@utils/pagination.js";
import { teacherService } from "../services/teacher.service.js";
import type { Request, Response } from "express";

export const getAllTeachers = async (
  req: Request<unknown, unknown, unknown, { page?: string; limit?: string }>,
  res: Response,
) => {
  const { page, limit, skip } = getPaginationOptions(req.query.page, req.query.limit);
  const { teachers, totalResults } = await teacherService.findAll(skip, limit);

  res.status(200).json({
    status: "success",
    results: teachers.length,
    data: teachers,
    pagination: formatPagination(totalResults, page, limit),
  });
};

export const getOneTeacher = async (req: Request<{ id: string }>, res: Response) => {
  const teacher = await teacherService.findById(req.params.id);
  res.status(200).json({ status: "success", data: teacher });
};

export const getMyTeacherProfile = async (req: Request, res: Response) => {
  const teacher = await teacherService.findByUserId(req.user.id);
  if (!teacher) throw new AppError("Teacher profile not found for this user account.", 404);
  res.status(200).json({ status: "success", data: teacher });
};

export const updateTeacher = async (req: Request, res: Response) => {
  const teacher = await teacherService.updateByUserId(req.user.id, req.body);
  res.status(200).json({ status: "success", data: teacher });
};

export const deleteTeacher = async (req: Request, res: Response) => {
  await teacherService.deleteByUserId(req.user.id);
  // 204 needs an empty body
  res.status(204).send();
};
