import type { Request, Response, NextFunction } from "express";

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission for this action",
      });
    }
    next();
  };
};
