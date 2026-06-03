/*
  Warnings:

  - The `subjects` column on the `teachers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "teachers" DROP COLUMN "subjects",
ADD COLUMN     "subjects" "Subject"[];
