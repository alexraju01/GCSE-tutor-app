import {
  getOwnAvailabilities,
  createAvailabilities,
  createRecurringAvailabilities,
  updateAvailability,
  deleteAvailability,
  deleteAvailabilities,
  deleteSeries,
} from "@controllers/availability.controller.js";
import { Role } from "@generated/client.js";
import { protect, authorize, validate } from "@middleware";
import { Router } from "express";
import {
  availabilityRangeQuerySchema,
  createAvailabilitySchema,
  recurringAvailabilitySchema,
  updateAvailabilitySchema,
  deleteAvailabilitySchema,
  seriesIdParamSchema,
} from "../schemas/availability.schema.js";

export const availabilityRouter = Router();

// /availability/me?from=&to=
availabilityRouter.get(
  "/me",
  protect,
  authorize(Role.Teacher),
  validate(availabilityRangeQuerySchema, "query"),
  getOwnAvailabilities,
);

// /availability
availabilityRouter.post(
  "/",
  protect,
  authorize(Role.Teacher),
  validate(createAvailabilitySchema),
  createAvailabilities,
);

// /availability/recurring — expand a weekly pattern server-side
availabilityRouter.post(
  "/recurring",
  protect,
  authorize(Role.Teacher),
  validate(recurringAvailabilitySchema),
  createRecurringAvailabilities,
);

// /availability/series/:seriesId - remove upcoming unbooked slots in a series
availabilityRouter.delete(
  "/series/:seriesId",
  protect,
  authorize(Role.Teacher),
  validate(seriesIdParamSchema, "params"),
  deleteSeries,
);

// /availability/:id
availabilityRouter.patch(
  "/:id",
  protect,
  authorize(Role.Teacher),
  validate(updateAvailabilitySchema),
  updateAvailability,
);

// /availability — batch remove
availabilityRouter.delete(
  "/",
  protect,
  authorize(Role.Teacher),
  validate(deleteAvailabilitySchema),
  deleteAvailabilities,
);

// /availability/:id
availabilityRouter.delete("/:id", protect, authorize(Role.Teacher), deleteAvailability);
