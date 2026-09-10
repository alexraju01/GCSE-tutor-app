import {
  getOwnAvailabilities,
  createAvailabilities,
  updateAvailability,
  deleteAvailability,
} from "@controllers/availability.controller.js";
import { Role } from "@generated/client.js";
import { protect, authorize, validate } from "@middleware";
import { Router } from "express";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
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

// /availabilities/:id
availabilityRouter.patch(
  "/:id",
  protect,
  authorize(Role.Teacher),
  validate(updateAvailabilitySchema),
  updateAvailability,
);

// /availabilities/:id
availabilityRouter.delete("/:id", protect, authorize(Role.Teacher), deleteAvailability);
