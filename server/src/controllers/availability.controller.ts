import { formatPagination, getPaginationOptions } from "@utils/pagination.js";
import {
  findTeacherAvailabilities,
  requireTeacherId,
  createAvailabilities as createAvailabilitySlots,
  updateAvailabilityForTeacher,
  deleteAvailabilitiesForTeacher,
} from "../services/availability.service.js";
import type {
  AvailabilitySlotInput,
  createAvailabilityInput,
  DeleteAvailabilityInput,
} from "../schemas/availability.schema.js";
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
  const input = req.body as createAvailabilityInput;
  const isBatch = Array.isArray(input);
  const items: AvailabilitySlotInput[] = isBatch ? input : [input];

  const created = await createAvailabilitySlots(
    teacherId,
    items.map(({ startTime, durationInMinutes }) => ({
      startTime: new Date(startTime),
      durationInMinutes,
    })),
  );

  return res.status(201).json({
    status: "success",
    data: isBatch ? created : created[0],
  });
};

export const updateAvailability = async (req: Request<{ id: string }>, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { startTime: startIsoString, durationInMinutes } = req.body;

  const updatedAvailability = await updateAvailabilityForTeacher({
    teacherId,
    availabilityId: req.params.id,
    startIsoString,
    durationInMinutes,
  });

  return res.status(200).json({
    status: "success",
    data: updatedAvailability,
  });
};

export const deleteAvailability = async (req: Request<{ id: string }>, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  await deleteAvailabilitiesForTeacher(teacherId, [req.params.id]);

  return res.status(204).send();
};

export const deleteAvailabilities = async (req: Request, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { ids } = req.body as DeleteAvailabilityInput;
  await deleteAvailabilitiesForTeacher(teacherId, ids);

  return res.status(204).send();
};
