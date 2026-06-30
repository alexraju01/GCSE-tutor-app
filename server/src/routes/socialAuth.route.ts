import { Router } from "express";
import { socialSync } from "../controllers/auth.controller.js";

export const socialRouter = Router();

socialRouter.route("/social-sync").post(socialSync);
