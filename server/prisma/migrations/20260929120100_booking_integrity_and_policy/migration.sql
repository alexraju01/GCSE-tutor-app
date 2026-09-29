/*
  Booking integrity, booking policy, availability series and the
  notification outbox.

  NOTE: the two exclusion constraints below will fail to apply if existing
  rows already break them (overlapping slots for a teacher, or a student
  double-booked). On a dev database the simplest fix is `pnpm run seed`
  after migrating; on real data, resolve the listed conflicts first.
*/

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LessonBooked', 'LessonRequested', 'LessonConfirmed', 'LessonDeclined', 'LessonCancelled');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('Pending', 'Sent', 'Failed');

-- AlterTable: booking policy
ALTER TABLE "teachers"
ADD COLUMN "minNoticeHours" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN "maxAdvanceDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN "cancellationCutoffHours" INTEGER NOT NULL DEFAULT 24;

-- AlterTable: availability series
ALTER TABLE "availabilities" ADD COLUMN "seriesId" UUID;
CREATE INDEX "availabilities_seriesId_idx" ON "availabilities"("seriesId");

-- AlterTable: lesson lifecycle + integrity columns
ALTER TABLE "lessons"
ALTER COLUMN "availabilityId" DROP NOT NULL,
ADD COLUMN "activeAvailabilityId" TEXT,
ADD COLUMN "priceAtBooking" DECIMAL(10,2),
ADD COLUMN "bookingRef" VARCHAR(64),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledBy" "Role",
ADD COLUMN "cancelReason" VARCHAR(255),
ADD COLUMN "respondedAt" TIMESTAMP(3);

-- Backfill: every lesson that still holds its slot claims it.
UPDATE "lessons"
SET "activeAvailabilityId" = "availabilityId"
WHERE "status" IN ('Upcoming', 'Confirmed', 'Completed');

-- Backfill: freeze today's rate onto existing lessons.
UPDATE "lessons" l
SET "priceAtBooking" = ROUND(t."hourlyRate" * l."duration" / 60.0, 2)
FROM "teachers" t
WHERE t."id" = l."teacherId";

CREATE UNIQUE INDEX "lessons_activeAvailabilityId_key" ON "lessons"("activeAvailabilityId");
CREATE INDEX "lessons_studentId_bookingRef_idx" ON "lessons"("studentId", "bookingRef");

-- Foreign keys: lessons are history — never cascade-delete them.
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_teacherId_fkey";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lessons" DROP CONSTRAINT "lessons_studentId_fkey";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lessons" DROP CONSTRAINT "lessons_availabilityId_fkey";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "availabilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_status_createdAt_idx" ON "notifications"("status", "createdAt");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Database-enforced scheduling invariants (not expressible in schema.prisma).
-- The service layer checks these too, for friendly error messages; these are
-- the guarantee that holds under any concurrency.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- A teacher's slots never overlap.
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_no_overlap"
  EXCLUDE USING gist ("teacherId" WITH =, tsrange("startTime", "endTime") WITH &&);

-- A student is never in two live lessons at once.
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_no_overlap"
  EXCLUDE USING gist (
    "studentId" WITH =,
    tsrange("startTime", "startTime" + "duration" * INTERVAL '1 minute') WITH &&
  ) WHERE ("status" IN ('Pending', 'Upcoming', 'Confirmed'));
