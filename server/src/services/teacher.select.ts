// src/services/teacher.select.ts
import type { Prisma } from "@generated/client.js";

export const teacherInclude = {
  user: {
    select: { id: true, name: true, email: true, image: true },
  },
  teaches: {
    select: { id: true, subject: true, level: true },
  },
} satisfies Prisma.TeacherInclude;

type TeacherWithRelations = Prisma.TeacherGetPayload<{ include: typeof teacherInclude }>;

export const flattenTeacher = ({ user, ...teacher }: TeacherWithRelations) => ({
  ...teacher,
  userId: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
});

export type TeacherDTO = ReturnType<typeof flattenTeacher>;
