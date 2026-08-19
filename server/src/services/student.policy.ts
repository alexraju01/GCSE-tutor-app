// src/services/student.policy.ts
import { prisma } from "@db/prisma.js";
import { Role } from "@generated/client.js";
import type { User } from "@generated/client.js";

export const canViewStudent = async (
  viewer: Pick<User, "id" | "role">,
  student: { id: string; userId: string },
): Promise<boolean> => {
  if (viewer.role === Role.Admin) return true;

  if (viewer.role === Role.Student) {
    return student.userId === viewer.id;
  }

  if (viewer.role === Role.Teacher) {
    const activeLesson = await prisma.lesson.findFirst({
      where: {
        studentId: student.id,
        teacher: { userId: viewer.id },
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
      },
      select: { id: true }, // we only need existence, not the full row
    });
    return activeLesson !== null;
  }

  return false;
};
