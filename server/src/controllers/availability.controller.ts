import { prisma } from "@db/prisma.js";
import { AppError } from "@utils/AppError.js";
import { formatPagination, getPaginationOptions } from "@utils/pagination.js";
import {
  findTeacherAvailabilities,
  requireTeacherId,
  checkOverlap,
} from "../services/availability.service.js";
import type { Request, Response } from "express";

/**
 * Public: Get unbooked availability slots for a specific teacher with pagination.
 */
export const getTeacherAvailabilities = async (
  req: Request<{ teacherId: string }, unknown, unknown, { page?: string; limit?: string }>,
  res: Response,
) => {
  const { teacherId } = req.params;
  const { page, limit, skip } = getPaginationOptions(req.query.page, req.query.limit);

  const { availabilities, totalResults } = await findTeacherAvailabilities({
    teacherId,
    skip,
    limit,
    onlyUnbooked: true,
  });

  return res.status(200).json({
    status: "success",
    results: availabilities.length,
    data: availabilities,
    pagination: formatPagination(totalResults, page, limit),
  });
};

/**
 * Private: Get all availability slots (booked & unbooked) for the authenticated teacher with pagination.
 */
export const getOwnAvailabilities = async (
  req: Request<unknown, unknown, unknown, { page?: string; limit?: string }>,
  res: Response,
) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { page, limit, skip } = getPaginationOptions(req.query.page, req.query.limit);

  const { availabilities, totalResults } = await findTeacherAvailabilities({
    teacherId,
    skip,
    limit,
    onlyUnbooked: false,
  });

  return res.status(200).json({
    status: "success",
    results: availabilities.length,
    data: availabilities,
    pagination: formatPagination(totalResults, page, limit),
  });
};

export const createAvailabilities = async (req: Request, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { startTime: startIsoString, durationInMinutes } = req.body;

  const startTime = new Date(startIsoString);
  if (startTime < new Date()) {
    throw new AppError("Cannot create availability in the past. Please select a future time.", 400);
  }

  const endTime = new Date(startTime.getTime() + durationInMinutes * 60 * 1000);
  await checkOverlap(teacherId, startTime, endTime);

  const newAvailability = await prisma.availability.create({
    data: { teacherId, startTime, endTime },
  });

  return res.status(201).json({
    status: "success",
    data: newAvailability,
  });
};

export const updateAvailability = async (req: Request<{ id: string }>, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { id: availabilityId } = req.params;
  const { startTime: startIsoString, durationInMinutes } = req.body;

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

  const updatedAvailability = await prisma.availability.update({
    where: { id: availabilityId },
    data: { startTime, endTime },
  });

  return res.status(200).json({
    status: "success",
    data: updatedAvailability,
  });
};

export const deleteAvailability = async (req: Request<{ id: string }>, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { id: availabilityId } = req.params;

  await prisma.availability.delete({
    where: {
      id: availabilityId,
      teacherId,
    },
  });

  return res.status(204).send();
};
