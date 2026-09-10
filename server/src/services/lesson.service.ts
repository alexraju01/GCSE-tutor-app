import { prisma } from "../db/prisma.js";
import type { GetLessonsQuery } from "../schemas/lesson.schema.js";

const USER_SELECT = {
  select: {
    name: true,
    image: true,
    email: true,
  },
} as const;

const BASE_LESSON_SELECT = {
  id: true,
  subject: true,
  topic: true,
  meetingRoomId: true,
  startTime: true,
  duration: true,
  status: true,
  notes: true,
} as const;

export interface FindLessonsParams extends GetLessonsQuery {
  userId: string;
  role: "Student" | "Teacher";
}

export const findLessonsByRole = async ({
  userId,
  role,
  page,
  limit,
  status,
  subject,
}: FindLessonsParams) => {
  const isStudent = role === "Student";
  const skip = (page - 1) * limit;

  const where = {
    ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    ...(status && { status }),
    ...(subject && { subject }),
  };

  // Conditionally include ONLY the opposite user profile at the Prisma query level
  const targetRelationSelect = isStudent
    ? { teacher: { select: { user: USER_SELECT } } }
    : { student: { select: { user: USER_SELECT } } };

  const [totalResults, rawLessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
      select: {
        ...BASE_LESSON_SELECT,
        ...targetRelationSelect,
      },
    }),
  ]);

  // Clean up structural nesting (e.g., rawLesson.teacher.user -> rawLesson.teacher)
  const lessons = rawLessons.map((lesson) => {
    if ("teacher" in lesson && lesson.teacher) {
      const { teacher, ...rest } = lesson;
      return { ...rest, teacher: teacher.user };
    }
    if ("student" in lesson && lesson.student) {
      const { student, ...rest } = lesson;
      return { ...rest, student: student.user };
    }
    return lesson;
  });

  return { lessons, totalResults };
};
