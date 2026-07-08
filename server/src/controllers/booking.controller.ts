import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { Request, Response, NextFunction } from "express";

export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role === "Student") {
    const bookings = await prisma.booking.findMany({
      where: { student: { userId } },
      select: {
        id: true,
        workspaceType: true,
        meetingRoomId: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        // Grab ONLY the essential user details for the teacher
        teacher: {
          select: {
            user: {
              select: {
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json({ status: "success", results: bookings.length, bookings });
  }

  if (role === "Teacher") {
    const bookings = await prisma.booking.findMany({
      where: { teacher: { userId } },
      select: {
        id: true,
        workspaceType: true,
        meetingRoomId: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        // Grab ONLY the essential user details for the student
        student: {
          select: {
            user: {
              select: {
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json({ status: "success", results: bookings.length, bookings });
  }

  return next(new AppError("Invalid user role for retrieving bookings.", 400));
};
