import { getAllAvailabilities } from "@controllers/availability.controller.js";
import { protect } from "@middleware";
import { Router } from "express";

export const availabilityRouter = Router();

availabilityRouter.get("/", protect, getAllAvailabilities);
