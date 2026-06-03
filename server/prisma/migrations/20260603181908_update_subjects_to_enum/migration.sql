/*
  Warnings:

  - The values [MATHEMATICS,PHYSICS,CHEMISTRY,BIOLOGY] on the enum `Subject` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Subject_new" AS ENUM ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Computer Science');
ALTER TABLE "teachers" ALTER COLUMN "subjects" TYPE "Subject_new"[] USING ("subjects"::text::"Subject_new"[]);
ALTER TYPE "Subject" RENAME TO "Subject_old";
ALTER TYPE "Subject_new" RENAME TO "Subject";
DROP TYPE "public"."Subject_old";
COMMIT;
