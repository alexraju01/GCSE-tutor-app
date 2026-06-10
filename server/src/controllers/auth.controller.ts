import { prisma } from "@db/prisma.js";
import { Prisma, type User } from "@generated/client.js";
import { Role, Subject } from "@generated/enums.js";
import { AppError } from "@utils/AppError.js";
import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { UserInput } from "../schemas/user.schema.js";
import type { Request, Response, CookieOptions, NextFunction, RequestHandler } from "express";

// Extract only the credentials payload from your Zod union
type CredentialsInput = Extract<UserInput, { provider: "credentials" }>;

// Strict type checking for the mapper function payload
interface TeacherFieldsPayload {
  bio?: string;
  qualifications?: string;
  hourlyRate?: number;
  subjects?: Subject[];
}

export const getProfileData = (role: Role, body: TeacherFieldsPayload) => {
  switch (role) {
    case Role.TEACHER:
      return {
        teacher: {
          create: {
            bio: body.bio || "",
            qualifications: body.qualifications || "",
            hourlyRate: body.hourlyRate || 0,
            subjects: body.subjects || [],
          },
        },
      };
    case Role.STUDENT:
      return { student: { create: {} } };
    default:
      return {};
  }
};

// Express v5 handles unhandled async rejections natively without try/catch wrapper loops
export const signUp: RequestHandler = async (req, res, next) => {
  const validatedData = req.body as UserInput;

  if (validatedData.provider !== "credentials") {
    return next(new AppError("Only credentials registration is supported right now.", 400));
  }

  // Type Narrowing: Safe assertion now that we know provider is definitively 'credentials'
  const credentialsData = validatedData as CredentialsInput;

  // Destructure safely now that TypeScript knows the exact subset structural options
  const { name, email, password, role } = credentialsData;
  const hashedPassword = await bcrypt.hash(password, 12);

  // If role is STUDENT, these will safely destructure as undefined, matching the helper signature
  const { bio, qualifications, hourlyRate, subjects } =
    credentialsData as Partial<TeacherFieldsPayload>;

  const profileRelation = getProfileData(role, { bio, qualifications, hourlyRate, subjects });

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
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

  const user = await prisma.user.findUnique({
    where: { email },
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

  res.status(statusCode).json({ status: "success", token, data: { user: safeUser } });
};

const signToken = (id: string): string => {
  const secret: Secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "90d") as jwt.SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };
  return jwt.sign({ id }, secret, options);
};
