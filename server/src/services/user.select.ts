import type { Prisma } from "@generated/client.js";

// Never include `password` here — this is what admin tooling and self-service
// endpoints return to a client.
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

// The authenticated user's own profile view — includes their role-specific
// relation (teacher or student) so the frontend can render either dashboard.
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
