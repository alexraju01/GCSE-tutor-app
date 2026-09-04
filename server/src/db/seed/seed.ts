import { faker } from "@faker-js/faker";
import { LessonStatus, Level, Role, Subject } from "@generated/client.js";
import { BLUE, GREEN, RED, RESET } from "@utils/colours.js";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.js";
import type { Availability } from "@generated/client.js";

// --- CONSTANTS ---
const TOTAL_TEACHERS = 5;
const TOTAL_STUDENTS = 10;
const TOTAL_LESSONS = 12;
const DEFAULT_PASSWORD = "password123";
const SESSION_DURATION_MS = 60 * 60 * 1000; // Standard 1-hour session format

// Helper to generate distinct Subject-Level combinations for a teacher
const generateMockTeachesPayload = () => {
  const allSubjects = Object.values(Subject);
  const selectedSubjects = faker.helpers.arrayElements(allSubjects, { min: 1, max: 3 });

  return selectedSubjects.map((subject) => ({
    subject,
    level: faker.helpers.arrayElement([Level.GCSE, Level.A_LEVEL]),
  }));
};

// Helper to generate distinct Subject-Level combinations for a student
const generateMockStudentSubjectsPayload = () => {
  const allSubjects = Object.values(Subject);
  const selectedSubjects = faker.helpers.arrayElements(allSubjects, { min: 1, max: 3 });

  return selectedSubjects.map((subject) => ({
    subject,
    level: faker.helpers.arrayElement([Level.GCSE, Level.A_LEVEL]),
  }));
};

// Clears data systematically to safeguard relational dependency trees
const clearDatabase = async (): Promise<void> => {
  console.info("🧹 Wiping existing database records clean...");
  await prisma.classroom.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.teaches.deleteMany();
  await prisma.studentSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
};

// Generates a single mock teacher and links their profile
const createMockTeacher = async (passwordHash: string, customEmail?: string) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = customEmail || faker.internet.email({ firstName, lastName }).toLowerCase();

  return prisma.user.create({
    data: {
      email,
      name: `${firstName} ${lastName}`,
      image: faker.image.avatar(),
      password: passwordHash,
      role: Role.Teacher,
      provider: "credentials",
      teacher: {
        create: {
          bio: `Hi, I am ${firstName}! ${faker.lorem.paragraph({ min: 2, max: 4 })}`,
          qualifications: `${faker.company.name()} University graduate. Certified Expert Educator.`,
          hourlyRate: faker.number.float({ min: 20, max: 55, fractionDigits: 2 }),
          rating: faker.number.float({ min: 4.2, max: 5.0, fractionDigits: 1 }),
          teaches: {
            create: generateMockTeachesPayload(),
          },
        },
      },
    },
    include: { teacher: { include: { teaches: true } } },
  });
};

// Generates a single mock student and links their profile with preferred subjects
const createMockStudent = async (passwordHash: string, customEmail?: string) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = customEmail || faker.internet.email({ firstName, lastName }).toLowerCase();

  return prisma.user.create({
    data: {
      email,
      name: `${firstName} ${lastName}`,
      image: faker.image.avatar(),
      password: passwordHash,
      role: Role.Student,
      provider: "credentials",
      student: {
        create: {
          subjects: {
            create: generateMockStudentSubjectsPayload(),
          },
        },
      },
    },
    include: { student: { include: { subjects: true } } },
  });
};

// Generates distinct calendar-date slots spread across PAST and FUTURE
const createTeacherAvailabilities = async (teacherId: string, isTestTeacher = false) => {
  let randomDates: Date[];

  if (isTestTeacher) {
    const pastDates = Array.from({ length: 4 }, () => faker.date.recent({ days: 14 }));
    const futureDates = Array.from({ length: 8 }, () => faker.date.soon({ days: 14 }));
    randomDates = [...pastDates, ...futureDates];
  } else {
    randomDates = Array.from({ length: 6 }, () => faker.date.soon({ days: 14 }));
  }

  const promises = randomDates.map((date) => {
    const startTime = new Date(date);
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime.getTime() + SESSION_DURATION_MS);

    return prisma.availability.create({
      data: {
        teacherId,
        startTime,
        endTime,
      },
    });
  });

  return Promise.all(promises);
};

// Handles execution contracts for creating lessons and physical live classrooms
const processLessonAndClassroom = async (
  slot: Availability,
  studentId: string,
  teacherSubjects: Subject[],
  forcedStatus?: LessonStatus,
): Promise<void> => {
  const isPastSlot = new Date(slot.endTime) < new Date();

  const status =
    forcedStatus ||
    (isPastSlot
      ? LessonStatus.Completed
      : faker.helpers.arrayElement([LessonStatus.Upcoming, LessonStatus.Confirmed]));

  const hasIntegratedClassroom = status !== LessonStatus.Cancelled && faker.datatype.boolean();
  const generatedMeetingRoomId = hasIntegratedClassroom ? faker.string.uuid() : null;

  const selectedSubject =
    teacherSubjects.length > 0
      ? faker.helpers.arrayElement(teacherSubjects)
      : faker.helpers.arrayElement(Object.values(Subject));

  const durationInMinutes = Math.round(
    (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60),
  );

  const lesson = await prisma.lesson.create({
    data: {
      teacherId: slot.teacherId,
      studentId,
      availabilityId: slot.id,
      subject: selectedSubject,
      topic: faker.company.catchPhrase().slice(0, 255),
      startTime: slot.startTime,
      duration: durationInMinutes || 60,
      status,
      meetingRoomId: generatedMeetingRoomId,
      notes: faker.lorem.sentence().slice(0, 255),
    },
  });

  if (generatedMeetingRoomId) {
    await prisma.classroom.create({
      data: {
        lessonId: lesson.id,
        meetingRoomId: generatedMeetingRoomId,
        joinCode: faker.string.numeric({ length: 6 }),
        isActive: !isPastSlot && status === LessonStatus.Confirmed,
      },
    });
  }
};

// --- MAIN FUNCTION ---

const main = async () => {
  await clearDatabase();
  console.info(`${BLUE}Database cleaned. Starting data seed execution...`);

  console.info(`${BLUE}Hashing default testing passwords...`);
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);

  // 1. Seed Teachers
  console.info(`${GREEN}Seeding ${TOTAL_TEACHERS} mock tutor profiles...`);
  const teacherUsers = await Promise.all(
    Array.from({ length: TOTAL_TEACHERS }, (_, index) =>
      createMockTeacher(passwordHash, index === 0 ? "teacher@test.com" : undefined),
    ),
  );
  const teachers = teacherUsers.map((u) => u.teacher).filter(Boolean);
  const testTeacher = teachers[0]!;

  const teacherSubjectsMap = new Map<string, Subject[]>();
  teachers.forEach((t) => {
    const subjects = t?.teaches.map((tp) => tp.subject) || [];
    teacherSubjectsMap.set(t!.id, subjects);
  });

  // 2. Seed Students
  console.info(`${GREEN}Seeding ${TOTAL_STUDENTS} mock student profiles...`);
  const studentUsers = await Promise.all(
    Array.from({ length: TOTAL_STUDENTS }, (_, index) =>
      createMockStudent(passwordHash, index === 0 ? "student@test.com" : undefined),
    ),
  );
  const students = studentUsers.map((u) => u.student).filter(Boolean);

  // 3. Generate schedule blocks across all instructors
  console.info(`${GREEN}Generating scheduling timelines for tutors...`);
  const availabilityNestedArrays = await Promise.all(
    teachers.map((t) => createTeacherAvailabilities(t!.id, t!.id === testTeacher.id)),
  );
  const allAvailabilities = availabilityNestedArrays.flat();

  // 4. Create explicit lessons for Test Teacher
  console.info(
    `${GREEN}Creating targeted completed, confirmed, upcoming, and cancelled lessons for test teacher...`,
  );
  const testTeacherAvailabilities = allAvailabilities.filter((a) => a.teacherId === testTeacher.id);

  const pastTestSlots = testTeacherAvailabilities.filter((a) => new Date(a.endTime) < new Date());
  const futureTestSlots = testTeacherAvailabilities.filter(
    (a) => new Date(a.startTime) >= new Date(),
  );

  const testTeacherSubjects = teacherSubjectsMap.get(testTeacher.id) || [];

  for (const slot of pastTestSlots) {
    const student = faker.helpers.arrayElement(students);
    if (student) {
      await processLessonAndClassroom(
        slot,
        student.id,
        testTeacherSubjects,
        LessonStatus.Completed,
      );
    }
  }

  let confirmedCount = 0;
  let upcomingCount = 0;
  let cancelledCount = 0;

  const confirmedTarget = Math.min(3, futureTestSlots.length);
  for (let i = 0; i < confirmedTarget; i++) {
    const student = faker.helpers.arrayElement(students);
    if (student) {
      await processLessonAndClassroom(
        futureTestSlots[i],
        student.id,
        testTeacherSubjects,
        LessonStatus.Confirmed,
      );
      confirmedCount++;
    }
  }

  const upcomingTarget = Math.min(6, futureTestSlots.length);
  for (let i = confirmedTarget; i < upcomingTarget; i++) {
    const student = faker.helpers.arrayElement(students);
    if (student) {
      await processLessonAndClassroom(
        futureTestSlots[i],
        student.id,
        testTeacherSubjects,
        LessonStatus.Upcoming,
      );
      upcomingCount++;
    }
  }

  for (let i = upcomingTarget; i < futureTestSlots.length; i++) {
    const student = faker.helpers.arrayElement(students);
    if (student) {
      await processLessonAndClassroom(
        futureTestSlots[i],
        student.id,
        testTeacherSubjects,
        LessonStatus.Cancelled,
      );
      cancelledCount++;
    }
  }

  // 5. Create additional lessons across remaining tutors
  console.info(`${GREEN}Creating additional general session lessons...`);
  const bookedSlotIds = new Set(testTeacherAvailabilities.map((a) => a.id));
  const remainingSlots = allAvailabilities.filter((a) => !bookedSlotIds.has(a.id));

  for (let i = 0; i < Math.min(TOTAL_LESSONS, remainingSlots.length); i++) {
    const slot = remainingSlots[i];
    const student = faker.helpers.arrayElement(students);
    const subjects = teacherSubjectsMap.get(slot.teacherId) || [];
    if (student) {
      await processLessonAndClassroom(slot, student.id, subjects);
    }
  }

  // 6. Persist calculated total hours and earnings to the database
  const completedTestBookingsCount = pastTestSlots.length;
  const hourlyRate = Number(testTeacher.hourlyRate);
  const calculatedTotalHours = completedTestBookingsCount * 1.0;
  const calculatedTotalEarnings = completedTestBookingsCount * hourlyRate;

  const updatedTestTeacher = await prisma.teacher.update({
    where: { id: testTeacher.id },
    data: {
      totalHours: calculatedTotalHours,
      totalEarnings: calculatedTotalEarnings,
    },
  });

  const testTeacherEarnings = Number(updatedTestTeacher.totalEarnings).toFixed(2);

  // 7. Terminal interface outputs
  console.info("\n-------------------------------------------------------");
  console.info(`${GREEN}🚀 Active Seed Accounts Ready for API Testing:`);
  console.info(`\n👨‍🏫 TEST TEACHER (Has completed, confirmed, upcoming & cancelled lessons):`);
  console.info(`   Name:              ${teacherUsers[0].name}`);
  console.info(`   Email:             teacher@test.com`);
  console.info(`   Password:          ${DEFAULT_PASSWORD}`);
  console.info(`   Hourly Rate:       £${hourlyRate.toFixed(2)}/hr`);
  console.info(`   Completed Lessons: ${completedTestBookingsCount}`);
  console.info(`   Confirmed Lessons: ${confirmedCount}`);
  console.info(`   Upcoming Lessons:  ${upcomingCount}`);
  console.info(`   Cancelled Lessons: ${cancelledCount}`);
  console.info(`   Total Hours Taught:${updatedTestTeacher.totalHours} hrs`);
  console.info(`   Total Earnings:    £${testTeacherEarnings}`);
  console.info(`\n🧑‍🎓 TEST STUDENT (Has linked lessons & enrolled subjects):`);
  console.info(`   Name:              ${studentUsers[0].name}`);
  console.info(`   Email:             student@test.com`);
  console.info(`   Password:          ${DEFAULT_PASSWORD}`);
  console.info(
    `   Subjects Learning: ${studentUsers[0].student?.subjects
      .map((s) => `${s.subject} (${s.level})`)
      .join(", ")}`,
  );
  console.info("-------------------------------------------------------\n");

  console.info(`${BLUE}Successfully seeded the database with booked lessons! ${RESET}`);
};

main()
  .catch((error) => {
    console.error(
      `${RED} Seeding execution stopped due to fatal process breakdown: ${RESET}`,
      error,
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
