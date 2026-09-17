import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { Request, Response, NextFunction } from "express";

/**
 * Gates server-to-server-only routes (e.g. social-auth sync) behind a shared
 * secret so they can't be invoked directly by a browser or third party —
 * only our own Next.js server, which knows INTERNAL_API_SECRET, can call them.
 */
export const requireInternalService = (req: Request, res: Response, next: NextFunction) => {
  const providedSecret = req.headers["x-internal-secret"];

  if (providedSecret !== env.INTERNAL_API_SECRET) {
    return next(new AppError("Not found.", 404));
  }

  next();
};
