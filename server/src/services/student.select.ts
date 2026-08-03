import type { Prisma } from "@generated/client.js";

export const studentInclude = {
  user: {
    select: { name: true, email: true, image: true, role: true },
  },
} satisfies Prisma.StudentInclude;

type StudentWithUser = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

export const flattenStudent = ({ user, ...student }: StudentWithUser) => ({
  ...student,
  ...user,
});

export type StudentDTO = ReturnType<typeof flattenStudent>;
