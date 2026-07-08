import { prisma } from "@db/prisma.js";
import { type User } from "@generated/client.js";
import { Role, Subject, type Level } from "@generated/enums.js";
import { AppError } from "@utils/AppError.js";
import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { UserInput } from "../schemas/auth.schema.js";
import type { Response, CookieOptions, RequestHandler } from "express";

type CredentialsInput = Extract<UserInput, { provider: "credentials" }>;

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

export const signUp: RequestHandler = async (req, res, next) => {
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

export const login: RequestHandler = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.password) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
};

const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(String(user.id));
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions: CookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN!) * 24 * 60 * 60 * 1000,
    ),
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
  const secret: Secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "90d") as jwt.SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };
  return jwt.sign({ id }, secret, options);
};

export const logout: RequestHandler = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("JWT", {
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

export const socialSync: SocialSyncHandler = async (req, res) => {
  const { email, name, image, provider, providerId } = req.body;

  // 2. Perform the Upsert
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      image,
      providerId,
    },
    create: {
      email,
      name,
      image,
      provider,
      providerId,
    },
  });

  createSendToken(user, 200, res);
};
