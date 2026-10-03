-- Separate migration on purpose: Postgres won't let a transaction use an enum
-- value it just added, and the next migration's exclusion constraint
-- references 'Pending'.

-- AlterEnum
ALTER TYPE "LessonStatus" ADD VALUE IF NOT EXISTS 'Pending' BEFORE 'Upcoming';
ALTER TYPE "LessonStatus" ADD VALUE IF NOT EXISTS 'Declined' AFTER 'Confirmed';
