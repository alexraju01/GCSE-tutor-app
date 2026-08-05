import { prisma } from "../db/prisma.js";
import type { UpdateUserInput } from "@schemas/user.schema.js";
import type { Request, Response } from "express";

export const getAllUsers = async (_: Request, res: Response) => {
  const allUsers = await prisma.user.findMany();

  res.status(200).json({ status: "success", results: allUsers.length, data: allUsers });
};

export const getOneUser = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUniqueOrThrow({ where: { id } });

  res.status(200).json({ status: "success", data: user });
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  await prisma.user.delete({ where: { id } });

  res.status(204).json({ status: "success", data: null });
};
export const updateMe = async (req: Request, res: Response) => {
  const { id: userId } = req.user;

  const { email, image } = req.body as UpdateUserInput;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(email && { email }),
      ...(image && { image }),
    },
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
};
