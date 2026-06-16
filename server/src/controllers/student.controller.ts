import { prisma } from "@db/prisma.js";
import { Role, type Student, type User } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";

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

export const getOneStudent: GetOneHandler<AllStudentsFlat> = async (req, res, next) => {
  const { id: studentId } = req.params;

  const loggedInUser = req.user;

  // 1. Fetch the student profile with the nested user information
  const student = await prisma.student.findUnique({
    where: { id: studentId },
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

  if (!student) return next(new AppError("No student found with that ID", 404));

  // 2. Multi-tenant Authorization Guardrails
  let isAuthorized = false;

  // Rule A: Admins bypass everything
  if (loggedInUser.role === Role.ADMIN) {
    isAuthorized = true;
  }

  // Rule B: Students can read their own specific profile
  if (loggedInUser.role === Role.STUDENT && student.userId === loggedInUser.id) {
    isAuthorized = true;
  }

  // Rule C: Teachers can ONLY see this student if they have an associated booking
  if (loggedInUser.role === Role.TEACHER) {
    const activeBooking = await prisma.booking.findFirst({
      where: {
        studentId,
        teacher: {
          userId: loggedInUser.id,
        },
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
      },
    });

    if (activeBooking) {
      isAuthorized = true;
    }
  }

  // Deny access if no conditions matched
  if (!isAuthorized) {
    throw new AppError("You do not have permission to view this student profile.", 403);
  }

  const { user, ...studentFields } = student;
  const flattenedStudent: AllStudentsFlat = {
    ...studentFields,
    ...user,
  };

  res.status(200).json({
    status: "success",
    data: flattenedStudent,
  });
};

export const deleteStudent: DeleteHandler = async (req, res) => {
  const { id } = req.user;

  await prisma.student.delete({ where: { userId: id } });

  res.status(204).json({ status: "success", data: null });
};
