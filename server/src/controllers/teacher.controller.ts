import { prisma } from "../db/prisma.js";
import type { UpdateTeacherInput } from "../schemas/teacher.schema.js";
import type { Teacher, User } from "@generated/client.js";

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

export const updateTeacher: UpdateHandler<Teacher> = async (req, res) => {
  const { id } = req.params;

  const updateData = req.body as UpdateTeacherInput;

  const updatedProfile = await prisma.teacher.update({
    where: { id },
    data: updateData,
  });

  res.status(201).json({ status: "success", data: updatedProfile });
};

export const deleteTeacher: DeleteHandler = async (req, res) => {
  const { id } = req.params;

  await prisma.teacher.delete({ where: { id } });
  res.status(204).json({ status: "success", data: null });
};
