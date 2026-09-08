// src/services/teacher.select.ts
import type { Prisma } from "@generated/client.js";

export const teacherSelect = {
  id: true,
  userId: true,
  bio: true,
  qualifications: true,
  hourlyRate: true,
  // Excluded: totalEarnings, totalHours, rating
  user: {
    select: { id: true, name: true, email: true, image: true },
  },
  teaches: {
    select: { id: true, subject: true, level: true },
  },
} satisfies Prisma.TeacherSelect;

type TeacherWithRelations = Prisma.TeacherGetPayload<{ select: typeof teacherSelect }>;

export const flattenTeacher = ({ user, ...teacher }: TeacherWithRelations) => ({
  ...teacher,
  userId: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
});

export type TeacherDTO = ReturnType<typeof flattenTeacher>;
