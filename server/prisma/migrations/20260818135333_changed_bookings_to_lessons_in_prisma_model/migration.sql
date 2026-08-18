/*
  Warnings:

  - You are about to drop the column `isBooked` on the `availabilities` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `classrooms` table. All the data in the column will be lost.
  - You are about to drop the `bookings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[lessonId]` on the table `classrooms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lessonId` to the `classrooms` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_availabilityId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_studentId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_bookingId_fkey";

-- DropIndex
DROP INDEX "classrooms_bookingId_key";

-- AlterTable
ALTER TABLE "availabilities" DROP COLUMN "isBooked",
ADD COLUMN     "lessonConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "classrooms" DROP COLUMN "bookingId",
ADD COLUMN     "lessonId" TEXT NOT NULL;

-- DropTable
DROP TABLE "bookings";

-- DropEnum
DROP TYPE "BookingStatus";

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "topic" VARCHAR(255),
    "meetingRoomId" UUID,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" "LessonStatus" NOT NULL DEFAULT 'PENDING',
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lessons_studentId_startTime_idx" ON "lessons"("studentId", "startTime");

-- CreateIndex
CREATE INDEX "lessons_teacherId_startTime_idx" ON "lessons"("teacherId", "startTime");

-- CreateIndex
CREATE INDEX "lessons_teacherId_startTime_status_idx" ON "lessons"("teacherId", "startTime", "status");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_lessonId_key" ON "classrooms"("lessonId");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "availabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
