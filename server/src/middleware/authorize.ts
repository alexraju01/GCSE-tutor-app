import { AppError } from "../utils/AppError.js";
import type { Role } from "@generated/enums.js";
import type { Request, Response, NextFunction } from "express";

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role as Role)) {
      return next(new AppError("You do not have permission for this action.", 403));
    }
    next();
  };
};
