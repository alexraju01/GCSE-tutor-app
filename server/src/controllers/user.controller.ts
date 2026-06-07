import { prisma } from "../db/prisma.js";
import type { User } from "@generated/client.js";

export const getAllUsers: GetAllHandler<User> = async (_, res) => {
  const allUsers = await prisma.user.findMany();

  res.status(200).json({ status: "success", results: allUsers.length, data: allUsers });
};

export const getOneUser: GetOneHandler<User> = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });

  res.status(200).json({ status: "success", data: user });
};

export const deleteUser: DeleteHandler = async (req, res) => {
  const { id } = req.params;

  await prisma.user.delete({ where: { id } });

  res.status(204).json({ status: "success", data: null });
};
