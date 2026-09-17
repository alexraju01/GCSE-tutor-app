import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { Request, Response, NextFunction } from "express";

// only the next.js server should ever hit routes behind this - it's the only
// thing that knows INTERNAL_API_SECRET, so this keeps randoms from calling
// social-sync directly
export const requireInternalService = (req: Request, res: Response, next: NextFunction) => {
  const providedSecret = req.headers["x-internal-secret"];

  if (providedSecret !== env.INTERNAL_API_SECRET) {
    return next(new AppError("Not found.", 404));
  }

  next();
};
