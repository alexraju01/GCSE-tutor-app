import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { Request, Response, NextFunction } from "express";

const expectedSecret = Buffer.from(env.INTERNAL_API_SECRET);

// timingSafeEqual throws on a length mismatch, so check length first.
const secretsMatch = (provided: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  if (providedBuffer.length !== expectedSecret.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedSecret);
};

// only the next.js server should ever hit routes behind this - it's the only
// thing that knows INTERNAL_API_SECRET, so this keeps randoms from calling
// social-sync directly
export const requireInternalService = (req: Request, res: Response, next: NextFunction) => {
  const providedSecret = req.headers["x-internal-secret"];

  if (typeof providedSecret !== "string" || !secretsMatch(providedSecret)) {
    return next(new AppError("Not found.", 404));
  }

  next();
};
