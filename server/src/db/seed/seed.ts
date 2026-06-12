import { faker } from "@faker-js/faker";
import { Role, BookingStatus, Level, Subject } from "@generated/client.js";
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

const getRandomSubjects = (): Subject[] => {
  const allSubjects = Object.values(Subject);
  return faker.helpers.arrayElements(allSubjects, { min: 1, max: 3 });
};

// Clears data systematically to safeguard relational dependency trees
const clearDatabase = async (): Promise<void> => {
  console.info("🧹 Wiping existing database records clean...");
  await prisma.classroom.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
};

// Generates a single mock teacher and links their profile (with optional custom email)
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
          qualifications: `${faker.company.name()} University graduate. Certified GCSE Expert Educator.`,
          hourlyRate: faker.number.float({ min: 20, max: 55, fractionDigits: 2 }),
          subjects: getRandomSubjects(),
          levels: faker.helpers.arrayElements([Level.GCSE, Level.A_LEVEL, Level.BOTH], 1),
          rating: faker.number.float({ min: 4.2, max: 5.0, fractionDigits: 1 }),
        },
      },
    },
    include: { teacher: true },
  });
};

// Generates a single mock student and links their profile (with optional custom email)
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

// Senior Refactor: Generates distinct calendar-date slots based on the new DateTime schema
const createTeacherAvailabilities = async (teacherId: string) => {
  // Generates 4 distinct upcoming dates over the next 7 days
  const randomDates = Array.from({ length: 4 }, () => faker.date.soon({ days: 7 }));

  const promises = randomDates.map((date) => {
    // Standardize time slots to top-of-the-hour blocks (e.g., 14:00:00)
    const startTime = new Date(date);
    startTime.setMinutes(0, 0, 0);

    // Automatically calculate the exact end time parameter
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

  // Lock out the discrete availability block
  await prisma.availability.update({
    where: { id: slot.id },
    data: { isBooked: true },
  });

  // Keep schedules identical to the availability allocation window
  const booking = await prisma.booking.create({
    data: {
      teacherId: slot.teacherId,
      studentId,
      availabilityId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status,
      notes: faker.lorem.sentence(),
    },
  });

  if (status === BookingStatus.CONFIRMED) {
    await prisma.classroom.create({
      data: {
        bookingId: booking.id,
        meetingRoomId: faker.string.uuid(),
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

  // 1. Seed Teachers (Forces the first one to use your static testing email)
  console.info(`${GREEN}Seeding ${TOTAL_TEACHERS} mock tutor profiles...`);
  const teacherUsers = await Promise.all(
    Array.from({ length: TOTAL_TEACHERS }, (_, index) =>
      createMockTeacher(passwordHash, index === 0 ? "teacher@test.com" : undefined),
    ),
  );
  const teachers = teacherUsers.map((u) => u.teacher).filter(Boolean);

  // 2. Seed Students (Forces the first one to use your static testing email)
  console.info(`${GREEN}Seeding ${TOTAL_STUDENTS} mock student profiles...`);
  const studentUsers = await Promise.all(
    Array.from({ length: TOTAL_STUDENTS }, (_, index) =>
      createMockStudent(passwordHash, index === 0 ? "student@test.com" : undefined),
    ),
  );
  const students = studentUsers.map((u) => u.student).filter(Boolean);

  // 3. Generate schedule blocks across all instructors (including your test teacher)
  console.info(`${GREEN}Generating weekly scheduling timelines for tutors...`);
  const availabilityNestedArrays = await Promise.all(
    teachers.map((t) => createTeacherAvailabilities(t!.id)),
  );
  const allAvailabilities = availabilityNestedArrays.flat();

  // 4. Create bookings across all availabilities smoothly
  console.info(`${GREEN}Creating historical and active session bookings...`);
  const slotsToBook = faker.helpers.arrayElements(allAvailabilities, TOTAL_BOOKINGS);

  for (const slot of slotsToBook) {
    const randomStudent = faker.helpers.arrayElement(students);
    if (randomStudent) {
      await processBookingAndClassroom(slot, randomStudent.id);
    }
  }

  // 5. Clean, accurate terminal interface
  console.info("\n-------------------------------------------------------");
  console.info(`${GREEN}🚀 Active Seed Accounts Ready for API Testing:`);
  console.info(`\n👨‍🏫 TEST TEACHER (Has linked availabilities/bookings):`);
  console.info(`   Name:     ${teacherUsers[0].name}`);
  console.info(`   Email:    teacher@test.com`);
  console.info(`   Password: ${DEFAULT_PASSWORD}`);
  console.info(`\n🧑‍🎓 TEST STUDENT (Has linked bookings):`);
  console.info(`   Name:     ${studentUsers[0].name}`);
  console.info(`   Email:    student@test.com`);
  console.info(`   Password: ${DEFAULT_PASSWORD}`);
  console.info("-------------------------------------------------------\n");

  console.info(`${BLUE}Successfully seeded the database! ${RESET}`);
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
