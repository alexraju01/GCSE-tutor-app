import { formatPagination, getPaginationOptions } from "@utils/pagination.js";
import {
  findTeacherAvailabilities,
  findBookableAvailabilities,
  findOwnAvailabilitiesInRange,
  requireTeacherId,
  createAvailabilities as createAvailabilitySlots,
  createRecurringAvailabilities as createRecurringAvailabilitySlots,
  updateAvailabilityForTeacher,
  deleteAvailabilitiesForTeacher,
  deleteSeriesForTeacher,
} from "../services/availability.service.js";
import type {
  AvailabilityRangeQuery,
  AvailabilitySlotInput,
  createAvailabilityInput,
  DeleteAvailabilityInput,
  RecurringAvailabilityInput,
} from "../schemas/availability.schema.js";
import type { Request, Response } from "express";

/**
 * Public: bookable slots for a teacher.
 * ?from=&to= for a date range (+ booking policy), or the old ?page=&limit=
 */
export const getTeacherAvailabilities = async (
  req: Request<{ teacherId: string }>,
  res: Response,
) => {
  const { teacherId } = req.params;
  const query = req.query as AvailabilityRangeQuery;

  if (query.from && query.to) {
    const { availabilities, policy, bookableWindow } = await findBookableAvailabilities(teacherId, {
      from: new Date(query.from),
      to: new Date(query.to),
    });

    return res.status(200).json({
      status: "success",
      results: availabilities.length,
      data: availabilities,
      policy,
      bookableWindow,
    });
  }

  const { page, limit, skip } = getPaginationOptions(query.page, query.limit);
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
 * Private: the teacher's own slots (booked & unbooked), same query options as above.
 */
export const getOwnAvailabilities = async (req: Request, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const query = req.query as AvailabilityRangeQuery;

  if (query.from && query.to) {
    const availabilities = await findOwnAvailabilitiesInRange(teacherId, {
      from: new Date(query.from),
      to: new Date(query.to),
    });

    return res.status(200).json({
      status: "success",
      results: availabilities.length,
      data: availabilities,
    });
  }

  const { page, limit, skip } = getPaginationOptions(query.page, query.limit);
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

export const createRecurringAvailabilities = async (req: Request, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { created, skipped, seriesId } = await createRecurringAvailabilitySlots(
    teacherId,
    req.body as RecurringAvailabilityInput,
  );

  return res.status(201).json({
    status: "success",
    results: created.length,
    data: created,
    skipped,
    seriesId,
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

export const deleteSeries = async (req: Request<{ seriesId: string }>, res: Response) => {
  const teacherId = await requireTeacherId(req.user?.id);
  const { deleted, keptBooked } = await deleteSeriesForTeacher(teacherId, req.params.seriesId);

  return res.status(200).json({
    status: "success",
    data: { deleted, keptBooked },
  });
};
