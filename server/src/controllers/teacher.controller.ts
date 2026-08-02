import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type { UpdateTeacherInput } from "../schemas/teacher.schema.js";
import type { Prisma } from "@generated/client.js";
import type { Request, Response, NextFunction } from "express";

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

export const getAllTeachers = async (_: Request, res: Response) => {
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

export const getOneTeacher = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const teacher = await prisma.teacher.findUniqueOrThrow({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
      teaches: {
        select: { subject: true, level: true },
      },
    },
  });

  res.status(200).json({ status: "success", data: teacher });
};

export const updateTeacher = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  const { id: userId } = req.user;
  const { teaches, ...scalarFields }: UpdateTeacherInput = req.body;

  // Separate items that have an ID (updates) from items that don't (creates)
  const teachesToUpdate = teaches?.filter((item) => item.id !== undefined) ?? [];
  const teachesToCreate = teaches?.filter((item) => item.id === undefined) ?? [];

  const updatedTeacher = await prisma.teacher.update({
    where: { userId },
    data: {
      ...scalarFields,
      ...(teaches && {
        teaches: {
          // 1. Update existing Teaches records using their existing ID
          update: teachesToUpdate.map((item) => ({
            where: { id: item.id },
            data: {
              subject: item.subject,
              level: item.level,
            },
          })),
          // 2. Insert new Teaches records (Prisma auto-generates the UUID for these)
          create: teachesToCreate.map((item) => ({
            subject: item.subject,
            level: item.level,
          })),
        },
      }),
    },
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

  if (!updatedTeacher) {
    return next(new AppError("Teacher profile not found.", 404));
  }

  res.status(200).json({
    status: "success",
    data: updatedTeacher,
  });
};
export const deleteTeacher = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.user;

  const teacher = await prisma.teacher.delete({ where: { userId: id } });

  if (!teacher) return next(new AppError("No Teacher found with this id", 404));
  res.status(204).json({ status: "success", data: null });
};

export const getMyTeacherProfile = async (req: Request, res: Response, next: NextFunction) => {
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

  res.status(200).json({
    status: "success",
    data: teacher,
  });
};
