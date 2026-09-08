-- CreateTable
CREATE TABLE "student_subjects" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "level" "Level" NOT NULL,

    CONSTRAINT "student_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_subjects_studentId_subject_level_key" ON "student_subjects"("studentId", "subject", "level");

-- AddForeignKey
ALTER TABLE "student_subjects" ADD CONSTRAINT "student_subjects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
