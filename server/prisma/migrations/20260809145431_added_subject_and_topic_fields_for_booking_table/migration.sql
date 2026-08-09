/*
  Warnings:

  - Added the required column `subject` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "subject" "Subject" NOT NULL,
ADD COLUMN     "topic" TEXT;
