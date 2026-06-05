import { prisma } from "@db/prisma.js";
import { Prisma, type User } from "@generated/client.js";
import { Role, Subject } from "@generated/enums.js";
import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { Request, Response, CookieOptions, NextFunction } from "express";

interface SignupRequestBody extends Prisma.UserCreateInput {
  passwordConfirm: string;
  // Specific teacher fields if role is TEACHER
  bio?: string;
  qualifications?: string;
  hourlyRate?: number;
  subjects?: Subject[];
}

export const getProfileData = (
  role: Role,
  body: Pick<SignupRequestBody, "bio" | "qualifications" | "hourlyRate" | "subjects">,
) => {
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

export const signUp = async (
  req: Request<unknown, unknown, SignupRequestBody>,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password, passwordConfirm, role, ...profileData } = req.body;

  if (password !== passwordConfirm) {
    return res
      .status(400)
      .json({ status: "fail", message: "Passwords and confirm password do not match" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || Role.STUDENT,
        ...getProfileData(role || Role.STUDENT, profileData),
      },
    });

    createSendToken(newUser, 201, res);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(400).json({ status: "fail", message: "Email already exists" });
      }
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Validation check
  if (!email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide email and password!",
    });
  }

  // 2. Database lookup
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 3. Authentication check
  // We check if user exists AND if the password field is populated
  if (!user || !user.password) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  }

  // 4. Password comparison
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  }

  // 5. Success
  createSendToken(user, 200, res);
};

const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(String(user.id));
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN!) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  } as CookieOptions;

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
