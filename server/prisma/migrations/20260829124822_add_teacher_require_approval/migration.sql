/*
  Warnings:

  - You are about to drop the column `lessonConfirmed` on the `availabilities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "availabilities" DROP COLUMN "lessonConfirmed";

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;
