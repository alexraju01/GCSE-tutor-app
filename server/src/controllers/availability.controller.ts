import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type {
  createAvailabilityInput,
  updateAvailabilityInput,
} from "../schemas/availability.schema.js";
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
        "This time slot overlaps with an availability block you've already created. Please select a different time.",
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

export const updateAvailability: UpdateHandler<
  Availability,
  { id: string },
  updateAvailabilityInput
> = async (req, res, next) => {
  const userId = req.user?.id;
  const { id: availabilityId } = req.params;
  const { startTime: startIsoString, durationInMinutes } = req.body as updateAvailabilityInput;

  if (!startIsoString && durationInMinutes === undefined) {
    return next(new AppError("Please provide at least one field to update.", 400));
  }
  const teacher = await prisma.teacher.findUnique({ where: { userId } });

  if (!teacher)
    return next(
      new AppError("Access Denied. Only registered tutors can modify availability timelines.", 403),
    );

  const existingAvailability = await prisma.availability.findFirst({
    where: { id: availabilityId, teacherId: teacher.id },
  });

  if (!existingAvailability) {
    return next(new AppError("Availability record not found or access denied.", 404));
  }

  let startTime = existingAvailability.startTime;
  if (startIsoString) {
    startTime = new Date(startIsoString);
    if (startTime < new Date()) {
      return next(
        new AppError(
          "Cannot schedule availability in the past. Please select a future date and time.",
          400,
        ),
      );
    }
  }

  const currentDurationInMinutes =
    (existingAvailability.endTime.getTime() - existingAvailability.startTime.getTime()) / 60 / 1000;

  const finalDuration =
    durationInMinutes !== undefined ? durationInMinutes : currentDurationInMinutes;

  const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);

  const explicitOverlap = await prisma.availability.findFirst({
    where: {
      teacherId: teacher.id,
      id: { not: availabilityId },
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
  });

  if (explicitOverlap)
    return next(
      new AppError(
        "This new time slot overlaps with another availability block you've already scheduled.",
        409,
      ),
    );

  const updatedAvailability = await prisma.availability.update({
    where: { id: availabilityId },
    data: {
      startTime,
      endTime,
    },
  });

  return res.status(200).json({
    status: "success",
    data: updatedAvailability,
  });
};
