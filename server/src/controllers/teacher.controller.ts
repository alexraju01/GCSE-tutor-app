import { prisma } from "../db/prisma.js";
import type { Teacher } from "@generated/client.js";

export const getAllTeachers: GetAllHandler<Teacher> = async (_, res) => {
  const teachers = await prisma.teacher.findMany();

  res.status(200).json({ status: "success", results: teachers.length, data: teachers });
};

export const getOneTeacher: GetOneHandler<Teacher> = async (req, res) => {
  const { id } = req.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });

  res.status(200).json({ status: "success", data: teacher });
};
