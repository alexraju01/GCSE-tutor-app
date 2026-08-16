import {
  createAvailabilities,
  getAllAvailabilities,
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
// Logged-in teacher routes to manage their own slots
// availabilityRouter.get("/me", protect, authorize(Role.Teacher), getMyAvailabilities);

availabilityRouter.get("/", protect, getAllAvailabilities);
availabilityRouter.post(
  "/",
  protect,
  authorize(Role.Teacher),
  validate(createAvailabilitySchema),
  createAvailabilities,
);
availabilityRouter.patch(
  "/:id",
  protect,
  authorize(Role.Teacher),
  validate(updateAvailabilitySchema),
  updateAvailability,
);

availabilityRouter.delete("/:id", protect, authorize(Role.Teacher), deleteAvailability);
