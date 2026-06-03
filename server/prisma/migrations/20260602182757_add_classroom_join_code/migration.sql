/*
  Warnings:

  - Added the required column `joinCode` to the `classrooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "joinCode" TEXT NOT NULL;
