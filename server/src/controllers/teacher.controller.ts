import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type { UpdateTeacherInput } from "../schemas/teacher.schema.js";
import type { Teacher, Prisma } from "@generated/client.js";
import type { RequestHandler } from "express";

// 1. Let Prisma infer the exact query payload structural return type
type PrismaTeacherPayload = Prisma.TeacherGetPayload<{
  include: {
    user: {
      select: { name: true; email: true; image: true };
    };
    teaches: {
      select: { id: true; subject: true; level: true };
    };
  };
}>;

// 2. Define AllTeachers to match your flattened JSON array item structure
export type AllTeachers = Omit<PrismaTeacherPayload, "user"> & {
  name: string | null;
  email: string;
  image: string | null;
};

export const getAllTeachers: GetAllHandler<AllTeachers> = async (_, res) => {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      teaches: {
        select: {
          id: true,
          subject: true,
          level: true,
        },
      },
    },
  });

  const allTeachers: AllTeachers[] = teachers.map(({ user, ...teacher }) => {
    const { id, userId, ...restOfTeacherFields } = teacher;

    return {
      id,
      userId,
      name: user.name,
      email: user.email,
      image: user.image,
      ...restOfTeacherFields,
    };
  });

  res.status(200).json({
    status: "success",
    results: allTeachers.length,
    data: allTeachers,
  });
};

export const getOneTeacher: GetOneHandler<Teacher> = async (req, res) => {
  const { id } = req.params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      teaches: {
        select: {
          subject: true,
          level: true,
        },
      },
    },
  });

  res.status(200).json({ status: "success", data: teacher });
};

export const updateTeacher: RequestHandler = async (req, res) => {
  // 1. Grab the user ID attached by the protect middleware
  const { id: userId } = req.user;

  // 2. Use the validated body directly (assert securely if your middleware types req.body)
  const updateData = req.body as UpdateTeacherInput;

  // 3. Update the profile using the user relation key
  const updatedProfile = await prisma.teacher.update({
    where: { userId },
    data: updateData,
  });

  // 4. Return a 200 OK status instead of 201
  res.status(200).json({
    status: "success",
    data: updatedProfile,
  });
};

export const deleteTeacher: DeleteHandler = async (req, res) => {
  const { id } = req.user;

  await prisma.teacher.delete({ where: { userId: id } });
  res.status(204).json({ status: "success", data: null });
};

export const getMyTeacherProfile: RequestHandler = async (req, res, next) => {
  // 1. Grab the current user ID attached by your protect/auth middleware
  const { id: userId } = req.user;

  // 2. Fetch the profile directly using the unique userId relation key
  const teacher = await prisma.teacher.findUnique({
    omit: { totalEarnings: true, totalHours: true, rating: true },
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      teaches: {
        select: {
          id: true,
          subject: true,
          level: true,
        },
      },
    },
  });

  if (!teacher) {
    return next(new AppError("Teacher profile not found for this user account.", 404));
  }

  // 3. Return the fully populated profile shape
  res.status(200).json({
    status: "success",
    data: teacher,
  });
};
