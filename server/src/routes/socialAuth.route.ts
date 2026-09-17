import { Router } from "express";
import { socialSync } from "../controllers/auth.controller.js";
import { requireInternalService, validate } from "../middleware/index.js";
import { socialSyncSchema } from "../schemas/auth.schema.js";

export const socialRouter = Router();

// Server-to-server only: called by our Next.js backend after it has already
// verified the OAuth handshake with the provider. Never expose this to browsers.
socialRouter
  .route("/social-sync")
  .post(requireInternalService, validate(socialSyncSchema), socialSync);
