import { Prisma } from "@generated/client.js";

// constraint names from the raw sql migrations. prisma doesn't know about
// exclusion/check constraints so the error type varies - match on the name instead
export const DB_CONSTRAINTS = {
  availabilityOverlap: "availabilities_no_overlap",
  studentLessonOverlap: "lessons_student_no_overlap",
  activeSlotBooking: "lessons_activeAvailabilityId_key",
  availabilityLength: "availabilities_lesson_length_check",
  lessonDuration: "lessons_duration_check",
} as const;

type ConstraintName = (typeof DB_CONSTRAINTS)[keyof typeof DB_CONSTRAINTS];

const errorText = (err: unknown): string => {
  if (!(err instanceof Error)) return "";
  const meta =
    err instanceof Prisma.PrismaClientKnownRequestError ? JSON.stringify(err.meta ?? {}) : "";
  return `${err.message} ${meta}`;
};

export const isConstraintViolation = (err: unknown, constraint: ConstraintName): boolean => {
  if (
    constraint === DB_CONSTRAINTS.activeSlotBooking &&
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return errorText(err).includes("activeAvailabilityId");
  }
  return errorText(err).includes(constraint);
};
