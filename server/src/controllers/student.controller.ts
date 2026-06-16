import { prisma } from "@db/prisma.js";
import type { Student, User } from "@generated/client.js";

type UserDetails = Pick<User, "name" | "email" | "image" | "role">;
type AllStudentsFlat = Student & UserDetails;

export const getAllStudents: GetAllHandler<AllStudentsFlat> = async (_, res) => {
  const students = await prisma.student.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });

  const flattenedStudents: AllStudentsFlat[] = students.map(({ user, ...student }) => ({
    ...student,
    ...user,
  }));

  res.status(200).json({
    status: "success",
    results: flattenedStudents.length,
    data: flattenedStudents,
  });
};
