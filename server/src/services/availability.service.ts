import { prisma } from "@db/prisma.js";
import { LessonStatus } from "@generated/client.js";
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

export const createAvailability = async (
  teacherId: string,
  startTime: Date,
  durationInMinutes: number,
) => {
  if (startTime < new Date()) {
    throw new AppError("Cannot create availability in the past. Please select a future time.", 400);
  }

  const endTime = new Date(startTime.getTime() + durationInMinutes * 60 * 1000);
  await checkOverlap(teacherId, startTime, endTime);

  return prisma.availability.create({
    data: { teacherId, startTime, endTime },
  });
};

interface UpdateAvailabilityParams {
  teacherId: string;
  availabilityId: string;
  startIsoString?: string;
  durationInMinutes?: number;
}

export const updateAvailabilityForTeacher = async ({
  teacherId,
  availabilityId,
  startIsoString,
  durationInMinutes,
}: UpdateAvailabilityParams) => {
  if (!startIsoString && durationInMinutes === undefined) {
    throw new AppError("Please provide at least one field to update.", 400);
  }

  const existing = await prisma.availability.findFirst({
    where: { id: availabilityId, teacherId },
    select: { startTime: true, endTime: true },
  });

  if (!existing) {
    throw new AppError("Availability record not found or access denied.", 404);
  }

  const startTime = startIsoString ? new Date(startIsoString) : existing.startTime;
  if (startIsoString && startTime < new Date()) {
    throw new AppError("Cannot schedule availability in the past.", 400);
  }

  const currentDuration = (existing.endTime.getTime() - existing.startTime.getTime()) / 60000;
  const finalDuration = durationInMinutes !== undefined ? durationInMinutes : currentDuration;
  const endTime = new Date(startTime.getTime() + finalDuration * 60000);

  await checkOverlap(teacherId, startTime, endTime, availabilityId);

  return prisma.availability.update({
    where: { id: availabilityId },
    data: { startTime, endTime },
  });
};

export const deleteAvailabilityForTeacher = (teacherId: string, availabilityId: string) =>
  prisma.availability.delete({
    where: { id: availabilityId, teacherId },
  });

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
    // A cancelled lesson shouldn't keep its slot permanently locked as "booked".
    ...(onlyUnbooked && { lessons: { none: { status: { not: LessonStatus.Cancelled } } } }),
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
