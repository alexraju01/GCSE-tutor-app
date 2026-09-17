import type { Prisma } from "@generated/client.js";

// no password field here, ever - this is what goes back to the client
export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type SafeUserDTO = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

// own-profile view, pulls in the teacher/student relation so the frontend
// knows which dashboard to render
export const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  provider: true,
  createdAt: true,
  teacher: {
    select: {
      id: true,
      bio: true,
      qualifications: true,
      hourlyRate: true,
      rating: true,
      totalHours: true,
      totalEarnings: true,
      teaches: {
        select: { id: true, subject: true, level: true },
      },
    },
  },
  student: {
    select: {
      id: true,
      subjects: {
        select: { id: true, subject: true, level: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type UserProfileDTO = Prisma.UserGetPayload<{ select: typeof userProfileSelect }>;
