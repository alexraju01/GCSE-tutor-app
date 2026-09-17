import { prisma } from "@db/prisma.js";
import { type User } from "@generated/client.js";
import { Role, Subject, type Level } from "@generated/enums.js";
import { AppError } from "@utils/AppError.js";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserInput, SocialSyncInput } from "../schemas/auth.schema.js";
import type { Response, Request, NextFunction, CookieOptions, RequestHandler } from "express";

type CredentialsInput = Extract<UserInput, { provider: "credentials" }>;

// A pre-computed hash with no matching plaintext. Comparing against this when a
// user isn't found keeps login's response time indistinguishable from a real
// user with a wrong password, so timing can't be used to enumerate accounts.
const DUMMY_PASSWORD_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8G8s.dl1a9E4x2P1kD5xR6h6Y5j0lC";

interface TeacherFieldsPayload {
  bio?: string;
  qualifications?: string;
  hourlyRate?: number;
  teaches: { subject: Subject; level: Level }[];
}

export const getProfileData = (role: Role, body: TeacherFieldsPayload) => {
  switch (role) {
    case Role.Teacher:
      return {
        teacher: {
          create: {
            bio: body.bio || "",
            qualifications: body.qualifications || "",
            hourlyRate: body.hourlyRate || 0,
            // Maps the array of items to match the Teaches relationship model
            teaches: {
              create: (body.teaches || []).map((t: { subject: Subject; level: Level }) => ({
                subject: t.subject,
                level: t.level,
              })),
            },
          },
        },
      };
    case Role.Student:
      return { student: { create: {} } };
    default:
      return {};
  }
};

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  const validatedData = req.body as UserInput;

  if (validatedData.provider !== "credentials") {
    return next(new AppError("Only credentials registration is supported right now.", 400));
  }

  const credentialsData = validatedData as CredentialsInput;
  const { name, email, password, role } = credentialsData;

  const normalizedEmail = email.toLowerCase().trim();

  const hashedPassword = await bcrypt.hash(password, 12);

  const { bio, qualifications, hourlyRate, teaches } = credentialsData as TeacherFieldsPayload;

  const profileRelation = getProfileData(role, {
    bio,
    qualifications,
    hourlyRate,
    teaches,
  });

  const newUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      ...profileRelation,
    },
  });

  createSendToken(newUser, 201, res);
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always run bcrypt.compare, even when no user/password exists, so a
  // missing account doesn't respond measurably faster than a wrong password
  // (see DUMMY_PASSWORD_HASH above).
  const isPasswordCorrect = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);

  if (!user || !user.password || !isPasswordCorrect) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
};

const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(String(user.id));
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

const signToken = (id: string): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ id }, env.JWT_SECRET, options);
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

/**
 * Server-to-server only (see requireInternalService middleware on this route).
 * Called by our Next.js backend after it has already verified the OAuth
 * handshake with Google/GitHub — this endpoint trusts that the email it's
 * given has been verified by the provider, it does not verify that itself.
 */
export const socialSync = async (req: Request, res: Response) => {
  const { email, name, image, provider, providerId, role } = req.body as SocialSyncInput;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name,
      image,
      providerId,
    },
    create: {
      email: normalizedEmail,
      name,
      image,
      provider,
      providerId,
      role,
      ...getProfileData(role, { teaches: [] }),
    },
  });

  createSendToken(user, 200, res);
};
