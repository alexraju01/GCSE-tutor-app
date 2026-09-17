import { type User } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { env } from "../config/env.js";
import {
  registerUser,
  verifyLoginCredentials,
  syncSocialUser,
  signAuthToken,
} from "../services/auth.service.js";
import type { UserInput, CredentialsInput, SocialSyncInput } from "../schemas/auth.schema.js";
import type { Response, Request, RequestHandler, CookieOptions } from "express";

export const signUp = async (req: Request, res: Response) => {
  const validatedData = req.body as UserInput;

  if (validatedData.provider !== "credentials") {
    throw new AppError("Only credentials registration is supported right now.", 400);
  }

  const newUser = await registerUser(validatedData as CredentialsInput);

  createSendToken(newUser, 201, res);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password!", 400);
  }

  const user = await verifyLoginCredentials(email, password);

  createSendToken(user, 200, res);
};

export const logout: RequestHandler = (req, res) => {
  const isProduction = env.NODE_ENV === "production";

  res.cookie("JWT", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10s
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
    data: null,
  });
};

// server-to-server only, see requireInternalService on this route - next.js
// calls this after it's already done the oauth handshake with google/github
export const socialSync = async (req: Request, res: Response) => {
  const user = await syncSocialUser(req.body as SocialSyncInput);

  createSendToken(user, 200, res);
};

// kept out of the service layer since it touches res directly (cookie + json body)
const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signAuthToken(String(user.id));
  const isProduction = env.NODE_ENV === "production";

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.cookie("JWT", token, cookieOptions);

  const { password: _, ...safeUser } = user;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user: safeUser },
  });
};
