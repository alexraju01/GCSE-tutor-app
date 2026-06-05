import { prisma } from "@db/prisma.js";
import { Prisma } from "@generated/client.js";
import { Role, Subject } from "@generated/enums.js";
import type { Request, Response, NextFunction } from "express";

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

  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || Role.STUDENT,
        ...getProfileData(role || Role.STUDENT, profileData),
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ status: "success", data: { user: userWithoutPassword } });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(400).json({ status: "fail", message: "Email already exists" });
      }
    }
    next(error);
  }
};
