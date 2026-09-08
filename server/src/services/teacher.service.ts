// src/services/teacher.service.ts
import { prisma } from "../db/prisma.js";
import { teacherSelect, flattenTeacher } from "./teacher.select.js";
import type { UpdateTeacherInput } from "../schemas/teacher.schema.js";

export const teacherService = {
  findAll: async () => {
    const teachers = await prisma.teacher.findMany({ select: teacherSelect });
    return teachers.map(flattenTeacher);
  },

  findById: async (id: string) => {
    const teacher = await prisma.teacher.findUniqueOrThrow({
      where: { id },
      select: teacherSelect,
    });
    return flattenTeacher(teacher);
  },

  findByUserId: async (userId: string) => {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: teacherSelect,
    });
    return teacher ? flattenTeacher(teacher) : null;
  },

  updateByUserId: async (userId: string, input: UpdateTeacherInput) => {
    const { teaches, ...scalarFields } = input;
    const teachesToUpdate = teaches?.filter((t) => t.id !== undefined) ?? [];
    const teachesToCreate = teaches?.filter((t) => t.id === undefined) ?? [];

    const updated = await prisma.teacher.update({
      where: { userId },
      data: {
        ...scalarFields,
        ...(teaches && {
          teaches: {
            update: teachesToUpdate.map((t) => ({
              where: { id: t.id },
              data: { subject: t.subject, level: t.level },
            })),
            create: teachesToCreate.map((t) => ({ subject: t.subject, level: t.level })),
          },
        }),
      },
      select: teacherSelect,
    });

    return flattenTeacher(updated);
  },

  deleteByUserId: (userId: string) => prisma.teacher.delete({ where: { userId } }),
};
