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

export const updateTeacher: UpdateHandler<Teacher> = async (req, res) => {
  const userId = req.params.id;

  const updatedProfile = await prisma.teacher.update({
    where: { id: userId },
    data: req.body,
  });

  res.status(201).json({ status: "success", data: updatedProfile });
};

export const deleteTeacher: DeleteHandler = async (req, res) => {
  const { id } = req.params;

  await prisma.teacher.delete({ where: { id } });
  res.status(204).json({ status: "success", data: null });
};
