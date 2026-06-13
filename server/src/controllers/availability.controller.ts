import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type { createAvailabilityInput } from "../schemas/availability.schema.js";
import type { Availability } from "@generated/client.js";

export const getAllAvailabilities: GetAllHandler<Availability> = async (req, res, next) => {
  const userId = req.user?.id;

  const teacherWithAvailabilities = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      availabilities: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!teacherWithAvailabilities) {
    return next(
      new AppError(
        "Access denied. Only registered tutors can view or manage availability timelines.",
        403,
      ),
    );
  }

  return res.status(200).json({
    status: "success",
    results: teacherWithAvailabilities.availabilities.length,
    data: teacherWithAvailabilities.availabilities,
  });
};

export const createAvailabilities: CreateHandler<Availability, createAvailabilityInput> = async (
  req,
  res,
  next,
) => {
  const userId = req.user?.id;

  const { startTime: startIsoString, durationInMinutes } = req.body;

  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    return next(
      new AppError("Access Denied. Only registered tutors can create availability timelines.", 403),
    );
  }

  const startTime = new Date(startIsoString);

  if (startTime < new Date()) {
    return next(
      new AppError(
        "Cannot create availability in the past. Please select a future date and time.",
        400,
      ),
    );
  }

  const endTime = new Date(startTime.getTime() + durationInMinutes * 60 * 1000);

  const explicitOverlap = await prisma.availability.findFirst({
    where: {
      teacherId: teacher.id,
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
  });

  if (explicitOverlap) {
    return next(
      new AppError(
        "Scheduling block collision: This slot overlaps with an existing availability frame.",
        409,
      ),
    );
  }

  const newAvailability = await prisma.availability.create({
    data: {
      teacherId: teacher.id,
      startTime,
      endTime,
    },
  });

  return res.status(201).json({
    status: "success",
    data: newAvailability,
  });
};
