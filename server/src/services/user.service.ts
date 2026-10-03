import { prisma } from "@db/prisma.js";
import { safeUserSelect, userProfileSelect } from "./user.select.js";
import type { UpdateUserInput } from "../schemas/user.schema.js";

export const userService = {
  findAll: async (skip: number, limit: number) => {
    const [users, totalResults] = await Promise.all([
      prisma.user.findMany({ select: safeUserSelect, skip, take: limit }),
      prisma.user.count(),
    ]);
    return { users, totalResults };
  },

  findById: (id: string) =>
    prisma.user.findUniqueOrThrow({ where: { id }, select: safeUserSelect }),

  findProfileByUserId: (userId: string) =>
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userProfileSelect }),

  deleteById: (id: string) => prisma.user.delete({ where: { id } }),

  updateByUserId: (userId: string, input: UpdateUserInput) => {
    const { email, image } = input;
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(email && { email }),
        ...(image && { image }),
      },
      select: safeUserSelect,
    });
  },
};
