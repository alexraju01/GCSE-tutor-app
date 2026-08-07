// src/controllers/student.controller.ts
import { studentService } from "../services/student.service.js";
import type { Request, Response } from "express";

export const getAllStudents = async (_req: Request, res: Response) => {
  const students = await studentService.findAll();
  res.status(200).json({ status: "success", results: students.length, data: students });
};

export const getOneStudent = async (req: Request<{ id: string }>, res: Response) => {
  const student = await studentService.findByIdForViewer(req.params.id, req.user);
  res.status(200).json({ status: "success", data: student });
};

export const deleteStudent = async (req: Request, res: Response) => {
  await studentService.deleteByUserId(req.user.id);
  res.status(204).json({ status: "success", data: null });
};

export const updateStudent = async (req: Request, res: Response) => {
  const student = await studentService.updateOwnProfile(req.user.id, req.body);
  res.status(200).json({ status: "success", data: student });
};
