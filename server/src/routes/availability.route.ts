import {
  getOwnAvailabilities,
  createAvailabilities,
  createRecurringAvailabilities,
  updateAvailability,
  deleteAvailability,
  deleteAvailabilities,
} from "@controllers/availability.controller.js";
import { Role } from "@generated/client.js";
import { protect, authorize, validate } from "@middleware";
import { Router } from "express";
import {
  createAvailabilitySchema,
  recurringAvailabilitySchema,
  updateAvailabilitySchema,
  deleteAvailabilitySchema,
} from "../schemas/availability.schema.js";

export const availabilityRouter = Router();

// /availabilities/me
availabilityRouter.get("/me", protect, authorize(Role.Teacher), getOwnAvailabilities);

// /availabilities
availabilityRouter.post(
  "/",
  protect,
  authorize(Role.Teacher),
  validate(createAvailabilitySchema),
  createAvailabilities,
);

// /availabilities/recurring — expand a weekly pattern server-side
availabilityRouter.post(
  "/recurring",
  protect,
  authorize(Role.Teacher),
  validate(recurringAvailabilitySchema),
  createRecurringAvailabilities,
);

// /availabilities/:id
availabilityRouter.patch(
  "/:id",
  protect,
  authorize(Role.Teacher),
  validate(updateAvailabilitySchema),
  updateAvailability,
);

// /availabilities — batch remove
availabilityRouter.delete(
  "/",
  protect,
  authorize(Role.Teacher),
  validate(deleteAvailabilitySchema),
  deleteAvailabilities,
);

// /availabilities/:id
availabilityRouter.delete("/:id", protect, authorize(Role.Teacher), deleteAvailability);
