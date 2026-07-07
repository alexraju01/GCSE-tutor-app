import { faker } from "@faker-js/faker";
import { Role, BookingStatus, Level, Subject, WorkspaceType } from "@generated/client.js";
import { GREEN, BLUE, RED, RESET } from "@utils/colours.js";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.js";
import type { Availability } from "@generated/client.js";

// --- CONSTANTS ---
const TOTAL_TEACHERS = 5;
const TOTAL_STUDENTS = 10;
const TOTAL_BOOKINGS = 8;
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

// Clears data systematically to safeguard relational dependency trees
const clearDatabase = async (): Promise<void> => {
  console.info("🧹 Wiping existing database records clean...");
  await prisma.classroom.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.teaches.deleteMany();
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
      role: Role.TEACHER,
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
    include: { teacher: true },
  });
};

// Generates a single mock student and links their profile
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
      role: Role.STUDENT,
      provider: "credentials",
      student: { create: {} },
    },
    include: { student: true },
  });
};

// Generates distinct calendar-date slots based on the new DateTime schema
const createTeacherAvailabilities = async (teacherId: string) => {
  const randomDates = Array.from({ length: 6 }, () => faker.date.soon({ days: 7 }));

  const promises = randomDates.map((date) => {
    const startTime = new Date(date);
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime.getTime() + SESSION_DURATION_MS);

    return prisma.availability.create({
      data: {
        teacherId,
        startTime,
        endTime,
        isBooked: false,
      },
    });
  });

  return Promise.all(promises);
};

// Handles execution contracts for creating bookings and physical live classrooms
const processBookingAndClassroom = async (slot: Availability, studentId: string): Promise<void> => {
  const status = faker.helpers.arrayElement([BookingStatus.PENDING, BookingStatus.CONFIRMED]);
  const workspaceType = faker.helpers.arrayElement([
    WorkspaceType.INTEGRATED_CLASSROOM,
    WorkspaceType.EXTERNAL,
  ]);

  const generatedMeetingRoomId =
    workspaceType === WorkspaceType.INTEGRATED_CLASSROOM ? faker.string.uuid() : null;

  // Lock out the discrete availability block
  await prisma.availability.update({
    where: { id: slot.id },
    data: { isBooked: true },
  });

  // Create booking with new inline tracking fields
  const booking = await prisma.booking.create({
    data: {
      teacherId: slot.teacherId,
      studentId,
      availabilityId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status,
      workspaceType,
      meetingRoomId: generatedMeetingRoomId,
      notes: faker.lorem.sentence(),
    },
  });

  // Seed the secondary Classroom model only if confirmed and using an integrated space
  if (
    status === BookingStatus.CONFIRMED &&
    workspaceType === WorkspaceType.INTEGRATED_CLASSROOM &&
    generatedMeetingRoomId
  ) {
    await prisma.classroom.create({
      data: {
        bookingId: booking.id,
        meetingRoomId: generatedMeetingRoomId,
        joinCode: faker.string.numeric({ length: 6 }),
        isActive: faker.datatype.boolean({ probability: 0.3 }),
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

  // 2. Seed Students
  console.info(`${GREEN}Seeding ${TOTAL_STUDENTS} mock student profiles...`);
  const studentUsers = await Promise.all(
    Array.from({ length: TOTAL_STUDENTS }, (_, index) =>
      createMockStudent(passwordHash, index === 0 ? "student@test.com" : undefined),
    ),
  );
  const students = studentUsers.map((u) => u.student).filter(Boolean);

  // 3. Generate schedule blocks across all instructors
  console.info(`${GREEN}Generating weekly scheduling timelines for tutors...`);
  const availabilityNestedArrays = await Promise.all(
    teachers.map((t) => createTeacherAvailabilities(t!.id)),
  );
  const allAvailabilities = availabilityNestedArrays.flat();

  // 4. Create bookings explicitly to ensure the requested total is met
  console.info(`${GREEN}Creating exactly ${TOTAL_BOOKINGS} active session bookings...`);

  // Pick out slots up to TOTAL_BOOKINGS explicitly
  const slotsToBook = allAvailabilities.slice(
    0,
    Math.min(TOTAL_BOOKINGS, allAvailabilities.length),
  );

  for (let i = 0; i < slotsToBook.length; i++) {
    const slot = slotsToBook[i];

    // Ensure the main test student gets the first booking for predictable API testing
    const student =
      i === 0
        ? students.find((s) => s!.userId === studentUsers[0].id)
        : faker.helpers.arrayElement(students);

    if (student) {
      await processBookingAndClassroom(slot, student.id);
    }
  }

  // 5. Terminal interface outputs
  console.info("\n-------------------------------------------------------");
  console.info(`${GREEN}🚀 Active Seed Accounts Ready for API Testing:`);
  console.info(`\n👨‍🏫 TEST TEACHER (Has linked availabilities/bookings):`);
  console.info(`   Name:      ${teacherUsers[0].name}`);
  console.info(`   Email:     teacher@test.com`);
  console.info(`   Password:  ${DEFAULT_PASSWORD}`);
  console.info(`\n🧑‍🎓 TEST STUDENT (Has linked bookings):`);
  console.info(`   Name:      ${studentUsers[0].name}`);
  console.info(`   Email:     student@test.com`);
  console.info(`   Password:  ${DEFAULT_PASSWORD}`);
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
