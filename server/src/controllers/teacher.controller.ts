import { prisma } from "../db/prisma.js";
import type { UpdateTeacherInput } from "../schemas/teacher.schema.js";
import type { Teacher, User } from "@generated/client.js";
import type { RequestHandler } from "express";

type UserDetails = Pick<User, "name" | "email">;

export type AllTeachers = Teacher & UserDetails;

export const getAllTeachers: GetAllHandler<AllTeachers> = async (_, res) => {
  const teachers = await prisma.teacher.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
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

  const teacher = await prisma.teacher.findUnique({ where: { id } });

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
