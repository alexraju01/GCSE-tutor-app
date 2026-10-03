-- lessons are 1h, 1.5h or 2h. prisma can't model check constraints, so they
-- live here. fails if existing rows break the rule - reseed the dev db if so.

ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_lesson_length_check"
  CHECK (EXTRACT(EPOCH FROM ("endTime" - "startTime")) IN (3600, 5400, 7200));

ALTER TABLE "lessons" ADD CONSTRAINT "lessons_duration_check"
  CHECK ("duration" IN (60, 90, 120));
