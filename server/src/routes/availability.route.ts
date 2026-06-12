import {
  createAvailabilities,
  getAllAvailabilities,
} from "@controllers/availability.controller.js";
import { protect, authorize } from "@middleware";
import { Router } from "express";

export const availabilityRouter = Router();

availabilityRouter.get("/", protect, getAllAvailabilities);
availabilityRouter.post("/", protect, authorize("TEACHER"), createAvailabilities);
