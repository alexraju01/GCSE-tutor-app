import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type {
  createAvailabilityInput,
  updateAvailabilityInput,
} from "../schemas/availability.schema.js";
import type { Availability } from "@generated/client.js";

const requireTeacherId = async (userId: string | undefined): Promise<string> => {
  if (!userId) {
    throw new AppError("Access denied. Authentication required.", 401);
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!teacher)
    throw new AppError("Access denied. Only registered tutors can manage availability.", 403);

  return teacher.id;
};

const checkOverlap = async (
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
    select: { id: true }, // Optimized selection
  });

  if (overlap) {
    throw new AppError(
      "This time slot overlaps with an availability block you've already scheduled.",
      409,
    );
  }
};

export const getAllAvailabilities: GetAllHandler<Availability> = async (req, res) => {
  const userId = req.user?.id;
  const teacherId = await requireTeacherId(userId);

  const availabilities = await prisma.availability.findMany({
    where: {
      teacherId,
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
  });

  return res.status(200).json({
    status: "success",
    results: availabilities.length,
    data: availabilities,
  });
};

export const createAvailabilities: CreateHandler<Availability, createAvailabilityInput> = async (
  req,
  res,
) => {
  const userId = req.user?.id;
  const { startTime: startIsoString, durationInMinutes } = req.body;

  const teacherId = await requireTeacherId(userId);
  const startTime = new Date(startIsoString);

  if (startTime < new Date()) {
    throw new AppError("Cannot create availability in the past. Please select a future time.", 400);
  }

  const endTime = new Date(startTime.getTime() + durationInMinutes * 60 * 1000);

  // Validate overlap
  await checkOverlap(teacherId, startTime, endTime);

  const newAvailability = await prisma.availability.create({
    data: {
      teacherId,
      startTime,
      endTime,
    },
  });

  return res.status(201).json({
    status: "success",
    data: newAvailability,
  });
};
export const updateAvailability: UpdateHandler<
  Availability,
  { id: string },
  updateAvailabilityInput
> = async (req, res, next) => {
  const userId = req.user?.id;
  const { id: availabilityId } = req.params;
  const { startTime: startIsoString, durationInMinutes } = req.body;

  if (!startIsoString && durationInMinutes === undefined)
    return next(new AppError("Please provide at least one field to update.", 400));

  const teacherId = await requireTeacherId(userId);

  const existing = await prisma.availability.findFirst({
    where: { id: availabilityId, teacherId },
    select: { startTime: true, endTime: true },
  });

  if (!existing) return next(new AppError("Availability record not found or access denied.", 404));

  const startTime = startIsoString ? new Date(startIsoString) : existing.startTime;

  if (startIsoString && startTime < new Date())
    next(new AppError("Cannot schedule availability in the past.", 400));

  const currentDuration = (existing.endTime.getTime() - existing.startTime.getTime()) / 60000;
  const finalDuration = durationInMinutes !== undefined ? durationInMinutes : currentDuration;
  const endTime = new Date(startTime.getTime() + finalDuration * 60000);

  await checkOverlap(teacherId, startTime, endTime, availabilityId);

  const updatedAvailability = await prisma.availability.update({
    where: { id: availabilityId },
    data: { startTime, endTime },
  });

  return res.status(200).json({
    status: "success",
    data: updatedAvailability,
  });
};
