import { AppError } from "@utils/AppError.js";
import { prisma } from "../db/prisma.js";
import type { Availability } from "@generated/client.js";

export const getAllAvailabilities: GetAllHandler<Availability> = async (req, res, next) => {
  const userId = req.user?.id;

  const teacherWithAvailabilities = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      availabilities: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!teacherWithAvailabilities) {
    return next(
      new AppError(
        "Access denied. Only registered tutors can view or manage availability timelines.",
        403,
      ),
    );
  }

  return res.status(200).json({
    status: "success",
    results: teacherWithAvailabilities.availabilities.length,
    data: teacherWithAvailabilities.availabilities,
  });
};
