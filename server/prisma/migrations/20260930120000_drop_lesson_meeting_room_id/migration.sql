-- Classroom.meetingRoomId is the single source of truth for a lesson's room.
-- Copy any room ids that only exist on the lesson across first so nothing is lost.
INSERT INTO "classrooms" ("id", "lessonId", "meetingRoomId", "isActive", "joinCode", "createdAt", "updatedAt")
SELECT gen_random_uuid(), l."id", l."meetingRoomId"::text, false, lpad((floor(random() * 1000000))::int::text, 6, '0'), NOW(), NOW()
FROM "lessons" l
WHERE l."meetingRoomId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "classrooms" c WHERE c."lessonId" = l."id")
ON CONFLICT DO NOTHING;

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "meetingRoomId";
