import { prisma } from "@db/prisma.js";
import { AppError } from "@utils/AppError.js";

export const requireTeacherId = async (userId?: string): Promise<string> => {
  if (!userId) throw new AppError("Unauthorized.", 401);

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!teacher) {
    throw new AppError("Access denied. Only registered tutors can manage availability.", 403);
  }

  return teacher.id;
};

export const checkOverlap = async (
  teacherId: string,
  startTime: Date,
  endTime: Date,
  excludeAvailabilityId?: string,
): Promise<void> => {
  const overlap = await prisma.availability.findFirst({
    where: {
      teacherId,
      ...(excludeAvailabilityId && { id: { not: excludeAvailabilityId } }),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  if (overlap) {
    throw new AppError(
      "This time slot overlaps with an availability block you've already scheduled.",
      409,
    );
  }
};

interface FindAvailabilitiesParams {
  teacherId: string;
  skip: number;
  limit: number;
  onlyUnbooked?: boolean;
}

export const findTeacherAvailabilities = async ({
  teacherId,
  skip,
  limit,
  onlyUnbooked = false,
}: FindAvailabilitiesParams) => {
  const whereCondition = {
    teacherId,
    startTime: { gte: new Date() },
    ...(onlyUnbooked && { lessons: { none: {} } }),
  };

  const [availabilities, totalResults] = await prisma.$transaction([
    prisma.availability.findMany({
      where: whereCondition,
      orderBy: { startTime: "asc" },
      skip,
      take: limit,
    }),
    prisma.availability.count({
      where: whereCondition,
    }),
  ]);

  return { availabilities, totalResults };
};
