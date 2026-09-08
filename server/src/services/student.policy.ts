import { prisma } from "@db/prisma.js";
import { Role, LessonStatus } from "@generated/client.js";
import type { User } from "@generated/client.js";

// Valid statuses that grant a teacher permission to view a student's profile
const AUTHORIZED_LESSON_STATUSES: LessonStatus[] = [
  LessonStatus.Upcoming,
  LessonStatus.Confirmed,
  LessonStatus.Completed,
];

export const canViewStudent = async (
  viewer: Pick<User, "id" | "role">,
  student: { id: string; userId: string },
): Promise<boolean> => {
  // 1. Admins have global access
  if (viewer.role === Role.Admin) return true;

  // 2. Students can only view their own profile
  if (viewer.role === Role.Student) {
    return student.userId === viewer.id;
  }

  // 3. Teachers can view students who have scheduled/completed lessons with them
  if (viewer.role === Role.Teacher) {
    const activeLesson = await prisma.lesson.findFirst({
      where: {
        studentId: student.id,
        teacher: { userId: viewer.id },
        status: { in: AUTHORIZED_LESSON_STATUSES },
      },
      select: { id: true },
    });

    return activeLesson !== null;
  }

  return false;
};
