import {
  createAvailabilities,
  getAllAvailabilities,
  updateAvailability,
} from "@controllers/availability.controller.js";
import { protect, authorize, validate } from "@middleware";
import { Router } from "express";
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from "../schemas/availability.schema.js";
export const availabilityRouter = Router();

availabilityRouter.get("/", protect, getAllAvailabilities);
availabilityRouter.post(
  "/",
  protect,
  authorize("TEACHER"),
  validate(createAvailabilitySchema),
  createAvailabilities,
);
availabilityRouter.patch(
  "/:id",
  protect,
  authorize("TEACHER"),
  validate(updateAvailabilitySchema),
  updateAvailability,
);
