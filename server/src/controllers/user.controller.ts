import { getPaginationOptions, formatPagination } from "@utils/pagination.js";
import { prisma } from "../db/prisma.js";
import type { UpdateUserInput } from "@schemas/user.schema.js";
import type { Request, Response } from "express";

// Never return the password hash to any client, admin tooling included.
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getAllUsers = async (
  req: Request<unknown, unknown, unknown, { page?: string; limit?: string }>,
  res: Response,
) => {
  const { page, limit, skip } = getPaginationOptions(req.query.page, req.query.limit);

  const [users, totalResults] = await Promise.all([
    prisma.user.findMany({ select: SAFE_USER_SELECT, skip, take: limit }),
    prisma.user.count(),
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
    pagination: formatPagination(totalResults, page, limit),
  });
};

export const getOneUser = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUniqueOrThrow({ where: { id }, select: SAFE_USER_SELECT });

  res.status(200).json({ status: "success", data: user });
};

export const getUserProfile = async (req: Request, res: Response) => {
  const { id: userId } = req.user;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      provider: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          bio: true,
          qualifications: true,
          hourlyRate: true,
          rating: true,
          totalHours: true,
          totalEarnings: true,
          teaches: {
            select: {
              id: true,
              subject: true,
              level: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          subjects: {
            select: {
              id: true,
              subject: true,
              level: true,
            },
          },
        },
      },
    },
  });

  res.status(200).json({ status: "success", data: user });
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  await prisma.user.delete({ where: { id } });

  // 204 No Content must not carry a response body.
  res.status(204).send();
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
    select: SAFE_USER_SELECT,
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
};
