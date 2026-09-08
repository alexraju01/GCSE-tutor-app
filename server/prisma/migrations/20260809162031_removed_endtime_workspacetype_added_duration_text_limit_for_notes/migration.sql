/*
  Warnings:

  - You are about to drop the column `endTime` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceType` on the `bookings` table. All the data in the column will be lost.
  - You are about to alter the column `notes` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The `meetingRoomId` column on the `bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `topic` on the `bookings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "endTime",
DROP COLUMN "workspaceType",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ALTER COLUMN "notes" SET DATA TYPE VARCHAR(255),
DROP COLUMN "meetingRoomId",
ADD COLUMN     "meetingRoomId" UUID,
ALTER COLUMN "topic" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "bookings_studentId_startTime_idx" ON "bookings"("studentId", "startTime");

-- CreateIndex
CREATE INDEX "bookings_teacherId_startTime_idx" ON "bookings"("teacherId", "startTime");

-- CreateIndex
CREATE INDEX "bookings_teacherId_startTime_status_idx" ON "bookings"("teacherId", "startTime", "status");
