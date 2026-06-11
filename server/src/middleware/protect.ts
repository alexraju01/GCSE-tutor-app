import jwt, { type Secret } from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import { changedPasswordAfter } from "../utils/changedPasswordAfter.js";
import type { Request, Response, NextFunction } from "express";

interface CustomJwtPayload extends jwt.JwtPayload {
  id: string;
  iat: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  let token;
  if (authorization && authorization.startsWith("Bearer")) {
    token = authorization.split(" ")[1];
  } else if (req.cookies.JWT) {
    token = req.cookies.JWT;
  }

  if (token === "loggedout")
    return next(new AppError("You are not logged in! Please login to get access.", 401));

  if (!token) return next(new AppError("Your are not logged in! Please login to get access.", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET as Secret) as CustomJwtPayload;

  const currentUser = await prisma.user.findUnique({ where: { id: String(decoded.id) } });
  if (!currentUser) {
    return next(new AppError("The user belonging to this token does not exist!", 401));
  }

  if (changedPasswordAfter(currentUser.passwordChangedAt, decoded.iat)) {
    return next(new AppError("User recently changed password! Please log in again.", 401));
  }

  req.user = currentUser;
  next();
};
