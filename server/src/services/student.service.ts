// src/services/student.service.ts
import { prisma } from "@db/prisma.js";
import { AppError } from "@utils/AppError.js";
import { canViewStudent } from "./student.policy.js";
import { studentInclude, flattenStudent } from "./student.select.js";
import type { UpdateStudentInput } from "../schemas/student.schema.js";
import type { User } from "@generated/client.js";

export const studentService = {
  findAll: async () => {
    const students = await prisma.student.findMany({ include: studentInclude });
    return students.map(flattenStudent);
  },

  findByIdForViewer: async (studentId: string, viewer: Pick<User, "id" | "role">) => {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: studentInclude,
    });

    if (!student) throw new AppError("No student found with that ID", 404);

    const authorized = await canViewStudent(viewer, student);
    if (!authorized) {
      throw new AppError("You do not have permission to view this student profile.", 403);
    }

    return flattenStudent(student);
  },

  deleteByUserId: (userId: string) => prisma.student.delete({ where: { userId } }),

  // src/services/student.service.ts — add to the existing object
  updateOwnProfile: async (userId: string, input: UpdateStudentInput) => {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: { name: true, email: true, image: true, role: true },
    });

    const student = await prisma.student.findUniqueOrThrow({
      where: { userId },
      select: { id: true, userId: true },
    });

    return { ...student, ...updatedUser };
  },
};
