import jwt, { type Secret } from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import { changedPasswordAfter } from "../utils/changedPasswordAfter.js";
import type { Request, Response, NextFunction } from "express";

interface CustomJwtPayload extends jwt.JwtPayload {
  id: string;
  iat: number;
}

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) {
  // Fail fast at boot, not on the first incoming request
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  let token: string | undefined;

  // 1) Extract token from header or cookie
  if (authorization?.startsWith("Bearer ")) {
    token = authorization.split(" ")[1];
  } else if (req.cookies?.JWT) {
    token = req.cookies.JWT;
  }

  // 2) Check if token exists and isn't the 'loggedout' placeholder
  if (!token || token === "loggedout") {
    return next(new AppError("You are not logged in! Please login to get access.", 401));
  }

  // 3) Verify token safely
  let decoded: CustomJwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
  } catch {
    return next(new AppError("Invalid or expired token. Please log in again.", 401));
  }

  // 4) Check if user still exists
  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      passwordChangedAt: true,
    },
  });
  if (!currentUser) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }
  // 5) Check if password was changed after token issuance
  if (changedPasswordAfter(currentUser.passwordChangedAt, decoded.iat)) {
    return next(new AppError("User recently changed password! Please log in again.", 401));
  }

  // GRANT ACCESS
  req.user = currentUser;
  next();
};
