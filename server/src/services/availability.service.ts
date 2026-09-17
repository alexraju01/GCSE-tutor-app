import { prisma } from "@db/prisma.js";
import { LessonStatus, Prisma } from "@generated/client.js";
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

// lets these run inside a transaction too, not just against the top-level client
type Db = Prisma.TransactionClient;

export const checkOverlap = async (
  db: Db,
  teacherId: string,
  startTime: Date,
  endTime: Date,
  excludeAvailabilityId?: string,
): Promise<void> => {
  const overlap = await db.availability.findFirst({
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

// block reschedule/delete while a slot has a live booking on it - moving it
// would desync the lesson's startTime, deleting it cascades and wipes the
// lesson row entirely
const assertNoActiveLesson = async (db: Db, availabilityId: string, action: string) => {
  const activeLesson = await db.lesson.findFirst({
    where: { availabilityId, status: { not: LessonStatus.Cancelled } },
    select: { id: true },
  });

  if (activeLesson) {
    throw new AppError(
      `Cannot ${action} this slot — it has an active booking. Cancel the lesson first.`,
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

  return prisma.$transaction(
    async (tx) => {
      await checkOverlap(tx, teacherId, startTime, endTime);
      return tx.availability.create({ data: { teacherId, startTime, endTime } });
    },
    // serializable so two overlapping creates can't both sneak past the check
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
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

  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.availability.findFirst({
        where: { id: availabilityId, teacherId },
        select: { startTime: true, endTime: true },
      });

      if (!existing) {
        throw new AppError("Availability record not found or access denied.", 404);
      }

      await assertNoActiveLesson(tx, availabilityId, "reschedule");

      const startTime = startIsoString ? new Date(startIsoString) : existing.startTime;
      if (startIsoString && startTime < new Date()) {
        throw new AppError("Cannot schedule availability in the past.", 400);
      }

      const currentDuration = (existing.endTime.getTime() - existing.startTime.getTime()) / 60000;
      const finalDuration = durationInMinutes !== undefined ? durationInMinutes : currentDuration;
      const endTime = new Date(startTime.getTime() + finalDuration * 60000);

      await checkOverlap(tx, teacherId, startTime, endTime, availabilityId);

      return tx.availability.update({
        where: { id: availabilityId },
        data: { startTime, endTime },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const deleteAvailabilityForTeacher = (teacherId: string, availabilityId: string) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.availability.findFirst({
      where: { id: availabilityId, teacherId },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("Availability record not found or access denied.", 404);
    }

    await assertNoActiveLesson(tx, availabilityId, "delete");

    await tx.availability.delete({ where: { id: availabilityId } });
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
