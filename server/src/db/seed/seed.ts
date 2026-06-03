import { faker } from "@faker-js/faker";
import { Role, BookingStatus, Level, Subject } from "@generated/client.js";
import { GREEN, BLUE, RED, RESET } from "@utils/colours.js";
import { prisma } from "../prisma.js";
import type { Availability } from "@generated/client.js";

// --- CONSTANTS ---

const TOTAL_TEACHERS = 5;
const TOTAL_STUDENTS = 10;
const TOTAL_BOOKINGS = 8;

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

// Provisions the default administrative operational account
const seedAdminAccount = async (): Promise<void> => {
  await prisma.user.create({
    data: {
      email: "admin@gcsestudents.com",
      name: "Admin Administrator",
      role: Role.ADMIN,
      provider: "credentials",
    },
  });
};

// Generates a single mock teacher and links their profile
const createMockTeacher = async () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return prisma.user.create({
    data: {
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      name: `${firstName} ${lastName}`,
      image: faker.image.avatar(),
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

// Generates a single mock student and links their profile
const createMockStudent = async () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return prisma.user.create({
    data: {
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      name: `${firstName} ${lastName}`,
      image: faker.image.avatar(),
      role: Role.STUDENT,
      provider: "credentials",
      student: { create: {} },
    },
    include: { student: true },
  });
};

// Generates recurring available time blocks for a specific instructor
const createTeacherAvailabilities = async (teacherId: string) => {
  const randomDays = faker.helpers.arrayElements([1, 2, 3, 4, 5, 6], 3); // Mon-Sat

  const promises = randomDays.map((day) =>
    prisma.availability.create({
      data: {
        teacherId,
        dayOfWeek: day,
        startTime: "16:00",
        endTime: "17:00",
        isBooked: false,
      },
    }),
  );
  return Promise.all(promises);
};

// Handles execution contracts for creating bookings and physical live classrooms
const processBookingAndClassroom = async (slot: Availability, studentId: string): Promise<void> => {
  const startTime = faker.date.soon({ days: 7 });
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1-hour session duration
  const status = faker.helpers.arrayElement([BookingStatus.PENDING, BookingStatus.CONFIRMED]);

  // Lock out the availability block
  await prisma.availability.update({
    where: { id: slot.id },
    data: { isBooked: true },
  });

  const booking = await prisma.booking.create({
    data: {
      teacherId: slot.teacherId,
      studentId,
      availabilityId: slot.id,
      startTime,
      endTime,
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

  await seedAdminAccount();

  console.info(`${GREEN}Seeding ${TOTAL_TEACHERS} mock tutor profiles...`);
  const teacherUsers = await Promise.all(Array.from({ length: TOTAL_TEACHERS }, createMockTeacher));
  const teachers = teacherUsers.map((u) => u.teacher).filter(Boolean);

  console.info(`${GREEN}Seeding ${TOTAL_STUDENTS} mock student profiles...`);
  const studentUsers = await Promise.all(Array.from({ length: TOTAL_STUDENTS }, createMockStudent));
  const students = studentUsers.map((u) => u.student).filter(Boolean);

  console.info(`${GREEN}Generating weekly scheduling timelines for tutors...`);
  const availabilityNestedArrays = await Promise.all(
    teachers.map((t) => createTeacherAvailabilities(t!.id)),
  );
  const allAvailabilities = availabilityNestedArrays.flat();

  console.info(`${GREEN}Creating historical and active session bookings...`);
  const slotsToBook = faker.helpers.arrayElements(allAvailabilities, TOTAL_BOOKINGS);

  // Sequential execution ensures clean data synchronization flags across shared relational blocks
  for (const slot of slotsToBook) {
    const randomStudent = faker.helpers.arrayElement(students);
    if (randomStudent) {
      await processBookingAndClassroom(slot, randomStudent.id);
    }
  }

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
