import { Router } from "express";
import { socialSync } from "../controllers/auth.controller.js";
import { requireInternalService, validate } from "../middleware/index.js";
import { socialSyncSchema } from "../schemas/auth.schema.js";

export const socialRouter = Router();

// server-to-server only, called by the next.js backend after it's done the
// oauth handshake. don't expose this to browsers
socialRouter
  .route("/social-sync")
  .post(requireInternalService, validate(socialSyncSchema), socialSync);
