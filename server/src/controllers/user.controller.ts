import { prisma } from "../db/prisma.js";
import type { Request, Response } from "express";

export const getAllUsers = async (_: Request, res: Response) => {
  const allUsers = await prisma.user.findMany();

  res.status(200).json({ status: "success", results: allUsers.length, data: allUsers });
};

export const getOneUser = async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });

  res.status(200).json({ status: "success", data: user });
};

export const deleteUser = async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;

  await prisma.user.delete({ where: { id } });

  res.status(204).json({ status: "success", data: null });
};
