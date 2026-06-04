import { prisma } from "../db/prisma.js";
import type { Request, Response } from "express";

export const getAllUsers = async (_: Request, res: Response) => {
  const allUsers = await prisma.user.findMany();

  res.status(200).json({ status: "success", results: allUsers.length, data: allUsers });
};
