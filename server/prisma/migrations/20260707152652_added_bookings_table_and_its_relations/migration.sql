-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('INTEGRATED_CLASSROOM', 'EXTERNAL');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "meetingRoomId" TEXT,
ADD COLUMN     "workspaceType" "WorkspaceType" NOT NULL DEFAULT 'INTEGRATED_CLASSROOM';
