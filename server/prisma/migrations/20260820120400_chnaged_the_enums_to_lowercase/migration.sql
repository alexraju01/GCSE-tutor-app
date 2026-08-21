/*
  Warnings:

  - The values [PENDING,CONFIRMED,CANCELLED,COMPLETED] on the enum `LessonStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LessonStatus_new" AS ENUM ('Pending', 'Confirmed', 'Cancelled', 'Completed');
ALTER TABLE "public"."lessons" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "lessons" ALTER COLUMN "status" TYPE "LessonStatus_new" USING ("status"::text::"LessonStatus_new");
ALTER TYPE "LessonStatus" RENAME TO "LessonStatus_old";
ALTER TYPE "LessonStatus_new" RENAME TO "LessonStatus";
DROP TYPE "public"."LessonStatus_old";
ALTER TABLE "lessons" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;

-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "status" SET DEFAULT 'Pending';

-- DropEnum
DROP TYPE "WorkspaceType";
