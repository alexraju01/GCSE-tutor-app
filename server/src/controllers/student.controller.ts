// src/controllers/student.controller.ts
import { formatPagination, getPaginationOptions } from "@utils/pagination.js";
import { studentService } from "../services/student.service.js";
import type { Request, Response } from "express";

export const getAllStudents = async (
  req: Request<unknown, unknown, unknown, { page?: string; limit?: string }>,
  res: Response,
) => {
  const { page, limit, skip } = getPaginationOptions(req.query.page, req.query.limit);
  const { students, totalResults } = await studentService.findAll(skip, limit);

  res.status(200).json({
    status: "success",
    results: students.length,
    data: students,
    pagination: formatPagination(totalResults, page, limit),
  });
};

export const getOneStudent = async (req: Request<{ id: string }>, res: Response) => {
  const student = await studentService.findByIdForViewer(req.params.id, req.user);
  res.status(200).json({ status: "success", data: student });
};

export const deleteStudent = async (req: Request, res: Response) => {
  await studentService.deleteByUserId(req.user.id);
  // 204 No Content must not carry a response body.
  res.status(204).send();
};

export const updateStudent = async (req: Request, res: Response) => {
  const student = await studentService.updateOwnProfile(req.user.id, req.body);
  res.status(200).json({ status: "success", data: student });
};
