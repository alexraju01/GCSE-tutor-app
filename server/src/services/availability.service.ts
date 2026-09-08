import { prisma } from "@db/prisma.js";

interface GetAvailabilitiesParams {
  teacherId: string;
  from?: Date;
  to?: Date;
  includeBooked?: boolean;
}

export const findTeacherAvailabilities = async ({
  teacherId,
  from = new Date(),
  to,
  includeBooked = false,
}: GetAvailabilitiesParams) => {
  return prisma.availability.findMany({
    where: {
      teacherId,
      startTime: {
        gte: from,
        ...(to && { lte: to }),
      },
      // Hide already booked slots from students by default
      ...(!includeBooked && { isBooked: false }),
    },
    orderBy: { startTime: "asc" },
  });
};
