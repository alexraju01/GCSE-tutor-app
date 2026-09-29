import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import {
  LessonStatus,
  Level,
  NotificationStatus,
  NotificationType,
  Role,
  Subject,
} from "@generated/client.js";
import { BLUE, GREEN, RED, RESET } from "@utils/colours.js";
import { formatSessionTime, ukWallClockToDate } from "@utils/date.js";
import bcrypt from "bcrypt";
import { prisma } from "../prisma.js";
import type { Availability, Prisma } from "@generated/client.js";

// --- CONSTANTS ---
const TOTAL_EXTRA_TEACHERS = 4;
const TOTAL_STUDENTS = 10;
const DEFAULT_PASSWORD = "password123";

// weekday after-school slots (UK time), 1h each. every teacher gets their own
// times so a student's lesson never overlaps another tutor's open slot
const WEEKDAYS = [0, 1, 2, 3, 4]; // Mon–Fri
const AFTER_SCHOOL_HOURS = [15, 16, 17, 18, 19];
const CELLS_PER_TEACHER = 4;
const LESSON_MINUTES = 60;
// one-off 90 min saturday slots, staggered per teacher for the same reason
const SATURDAY_FIRST_START_MINUTES = 9 * 60;
const SATURDAY_SLOT_MINUTES = 90;
const PAST_WEEKS = 2; // history for completed/cancelled lessons
const FUTURE_WEEKS = 3; // bookable availability

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

// same as calculateLessonPrice in booking.policy.ts
const priceFor = (hourlyRate: number, minutes: number) =>
  Math.round(hourlyRate * minutes * (100 / 60)) / 100;

const subjectLabel = (subject: Subject) => subject.replace(/_/g, " ");

// --- UK DATE HELPERS ---
// generate slots in UK time regardless of the machine's timezone
const ukDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const addDaysToKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
};

const dayIndexOfKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0 = Monday
};

const ukInstant = (key: string, hour: number, minute = 0) => {
  const [y, m, d] = key.split("-").map(Number);
  return ukWallClockToDate(y, m, d, hour, minute);
};

// --- PROFILE HELPERS ---

// Helper to generate distinct Subject-Level combinations
const generateSubjectLevelPairs = () =>
  faker.helpers.arrayElements(Object.values(Subject), { min: 1, max: 3 }).map((subject) => ({
    subject,
    level: faker.helpers.arrayElement([Level.GCSE, Level.A_LEVEL]),
  }));

// Clears data systematically to safeguard relational dependency trees
const clearDatabase = async (): Promise<void> => {
  console.info("🧹 Wiping existing database records clean...");
  await prisma.notification.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.teaches.deleteMany();
  await prisma.studentSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
};

interface TeacherSeedOptions {
  email?: string;
  requireApproval?: boolean;
}

const createMockTeacher = async (passwordHash: string, options: TeacherSeedOptions = {}) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = options.email || faker.internet.email({ firstName, lastName }).toLowerCase();

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
          requireApproval: options.requireApproval ?? false,
          minNoticeHours: faker.helpers.arrayElement([2, 6, 12]),
          maxAdvanceDays: faker.helpers.arrayElement([30, 60, 90]),
          cancellationCutoffHours: faker.helpers.arrayElement([12, 24, 48]),
          teaches: { create: generateSubjectLevelPairs() },
        },
      },
    },
    include: { teacher: { include: { teaches: true } } },
  });
};

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
      student: { create: { subjects: { create: generateSubjectLevelPairs() } } },
    },
    include: { student: { include: { subjects: true } } },
  });
};

type SeededTeacher = NonNullable<Awaited<ReturnType<typeof createMockTeacher>>["teacher"]> & {
  name: string | null;
};
type SeededStudent = NonNullable<Awaited<ReturnType<typeof createMockStudent>>["student"]> & {
  userId: string;
  name: string | null;
};

// --- AVAILABILITY ---

interface WeeklyCell {
  dayIndex: number; // 0 = Monday
  hour: number;
}

// hands out (weekday, hour) cells so no two teachers share a time
const dealWeeklyCells = (teacherCount: number): WeeklyCell[][] => {
  const cells = faker.helpers.shuffle(
    WEEKDAYS.flatMap((dayIndex) => AFTER_SCHOOL_HOURS.map((hour) => ({ dayIndex, hour }))),
  );
  if (teacherCount * CELLS_PER_TEACHER > cells.length) {
    throw new Error(
      `Only ${cells.length} weekly cells for ${teacherCount} teachers — add hours or lower CELLS_PER_TEACHER.`,
    );
  }
  return Array.from({ length: teacherCount }, (_, i) =>
    cells.slice(i * CELLS_PER_TEACHER, (i + 1) * CELLS_PER_TEACHER),
  );
};

// weekly series on the teacher's cells (past + future weeks, one seriesId)
// plus a one-off saturday slot each week
const createTeacherAvailabilities = async (
  teacherId: string,
  cells: WeeklyCell[],
  teacherIndex: number,
) => {
  const todayKey = ukDateKeyFormatter.format(new Date());
  const thisMonday = addDaysToKey(todayKey, -dayIndexOfKey(todayKey));
  const seriesId = randomUUID();
  const now = new Date();
  const saturdayStart = SATURDAY_FIRST_START_MINUTES + teacherIndex * SATURDAY_SLOT_MINUTES;

  const data: Prisma.AvailabilityCreateManyInput[] = [];

  for (let week = -PAST_WEEKS; week < FUTURE_WEEKS; week++) {
    for (const { dayIndex, hour } of cells) {
      const dateKey = addDaysToKey(thisMonday, week * 7 + dayIndex);
      const startTime = ukInstant(dateKey, hour);
      // skip anything happening right now
      if (startTime <= now && startTime.getTime() + LESSON_MINUTES * MINUTE_MS > now.getTime())
        continue;
      data.push({
        teacherId,
        startTime,
        endTime: new Date(startTime.getTime() + LESSON_MINUTES * MINUTE_MS),
        seriesId,
      });
    }

    // One-off Saturday slot each future week.
    if (week >= 1) {
      const saturday = addDaysToKey(thisMonday, week * 7 + 5);
      const startTime = ukInstant(saturday, Math.floor(saturdayStart / 60), saturdayStart % 60);
      data.push({
        teacherId,
        startTime,
        endTime: new Date(startTime.getTime() + SATURDAY_SLOT_MINUTES * MINUTE_MS),
      });
    }
  }

  const slots = await prisma.availability.createManyAndReturn({ data });
  return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

// --- LESSONS ---

// student -> booked time ranges, so we never double-book a student
// (lessons_student_no_overlap would reject it)
const studentBusy = new Map<string, { start: number; end: number }[]>();

const isStudentFree = (studentId: string, slot: Availability) => {
  const start = slot.startTime.getTime();
  const end = slot.endTime.getTime();
  return !(studentBusy.get(studentId) ?? []).some((b) => b.start < end && start < b.end);
};

const markBusy = (studentId: string, slot: Availability) => {
  studentBusy.set(studentId, [
    ...(studentBusy.get(studentId) ?? []),
    { start: slot.startTime.getTime(), end: slot.endTime.getTime() },
  ]);
};

const pickFreeStudent = (students: SeededStudent[], slot: Availability, prefer?: SeededStudent) => {
  if (prefer && isStudentFree(prefer.id, slot)) return prefer;
  const free = students.filter((s) => isStudentFree(s.id, slot));
  return free.length > 0 ? faker.helpers.arrayElement(free) : undefined;
};

// same as RELEASED_STATUSES in booking.policy.ts
const RELEASED: LessonStatus[] = [LessonStatus.Cancelled, LessonStatus.Declined];

const CANCEL_REASONS = [
  "School trip that day, sorry!",
  "Clashes with a mock exam.",
  "I'm unwell — sorry for the short notice.",
  "Family commitment came up.",
];

const DECLINE_REASONS = [
  "I'm fully booked that week — could you try the following Tuesday?",
  "I don't cover that topic at A-Level, sorry.",
];

const createLesson = async (
  slot: Availability,
  teacher: SeededTeacher,
  student: SeededStudent,
  status: LessonStatus,
) => {
  const duration = Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / MINUTE_MS);
  const subject = faker.helpers.arrayElement(teacher.teaches.map((t) => t.subject));
  const isReleased = RELEASED.includes(status);
  const respondedAt =
    status === LessonStatus.Confirmed || status === LessonStatus.Declined
      ? faker.date.recent({ days: 3 })
      : null;
  const cancelledBy =
    status === LessonStatus.Cancelled
      ? faker.helpers.arrayElement([Role.Student, Role.Teacher])
      : null;

  // half of the booked/completed lessons get a classroom
  const meetingRoomId =
    !isReleased && status !== LessonStatus.Pending && faker.datatype.boolean()
      ? randomUUID()
      : null;

  // cancelled/declined lessons don't take up the student's time
  if (!isReleased) markBusy(student.id, slot);

  const lesson = await prisma.lesson.create({
    data: {
      teacherId: teacher.id,
      studentId: student.id,
      availabilityId: slot.id,
      // cancelled/declined lessons give the slot back
      activeAvailabilityId: isReleased ? null : slot.id,
      subject,
      topic: faker.helpers.arrayElement([
        "Quadratic equations",
        "Forces and motion",
        "Organic chemistry",
        "Cell biology",
        "Macbeth: key themes",
        "Algorithms and pseudocode",
        null,
      ]),
      notes: faker.datatype.boolean() ? faker.lorem.sentence().slice(0, 255) : null,
      startTime: slot.startTime,
      duration,
      status,
      meetingRoomId,
      priceAtBooking: priceFor(Number(teacher.hourlyRate), duration),
      respondedAt,
      ...(status === LessonStatus.Declined && {
        cancelReason: faker.helpers.arrayElement(DECLINE_REASONS),
      }),
      ...(cancelledBy && {
        cancelledAt: faker.date.recent({ days: 5 }),
        cancelledBy,
        cancelReason: faker.helpers.arrayElement(CANCEL_REASONS),
      }),
    },
  });

  if (meetingRoomId) {
    await prisma.classroom.create({
      data: {
        lessonId: lesson.id,
        meetingRoomId,
        joinCode: faker.string.numeric({ length: 6 }),
        isActive: false,
      },
    });
  }

  return { ...lesson, subject };
};

// most future slots stay open so there's plenty to book. approval teachers
// get requests instead of instant bookings
const futureStatusFor = (requireApproval: boolean): LessonStatus | null => {
  const roll = Math.random();
  if (roll < 0.55) return null; // stays open
  if (requireApproval) {
    if (roll < 0.75) return LessonStatus.Pending;
    if (roll < 0.9) return LessonStatus.Confirmed;
    return LessonStatus.Declined;
  }
  if (roll < 0.9) return LessonStatus.Upcoming;
  return LessonStatus.Cancelled;
};

const pastStatusFor = (): LessonStatus | null => {
  const roll = Math.random();
  if (roll < 0.35) return null; // was never booked
  if (roll < 0.9) return LessonStatus.Completed;
  return LessonStatus.Cancelled;
};

// --- MAIN FUNCTION ---

const main = async () => {
  await clearDatabase();
  console.info(`${BLUE}Database cleaned. Starting data seed execution...`);

  console.info(`${BLUE}Hashing default testing passwords...`);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Teachers - two test accounts (instant booking + approval) and some random ones
  console.info(`${GREEN}Seeding tutor profiles...`);
  const teacherUsers = [
    await createMockTeacher(passwordHash, { email: "teacher@test.com" }),
    await createMockTeacher(passwordHash, {
      email: "approval.teacher@test.com",
      requireApproval: true,
    }),
    ...(await Promise.all(
      Array.from({ length: TOTAL_EXTRA_TEACHERS }, () => createMockTeacher(passwordHash)),
    )),
  ];
  const teachers: SeededTeacher[] = teacherUsers.map((u) => ({ ...u.teacher!, name: u.name }));
  const [testTeacher, approvalTeacher] = teachers;

  // 2. Students
  console.info(`${GREEN}Seeding ${TOTAL_STUDENTS} student profiles...`);
  const studentUsers = await Promise.all(
    Array.from({ length: TOTAL_STUDENTS }, (_, index) =>
      createMockStudent(passwordHash, index === 0 ? "student@test.com" : undefined),
    ),
  );
  const students: SeededStudent[] = studentUsers.map((u) => ({
    ...u.student!,
    userId: u.id,
    name: u.name,
  }));
  const testStudent = students[0];

  // 3. Availability - weekly after-school series per teacher
  console.info(`${GREEN}Generating weekly availability series...`);
  const slotsByTeacher = new Map<string, Availability[]>();
  const weeklyCells = dealWeeklyCells(teachers.length);
  for (const [index, teacher] of teachers.entries()) {
    slotsByTeacher.set(
      teacher.id,
      await createTeacherAvailabilities(teacher.id, weeklyCells[index], index),
    );
  }

  // 4. Lessons across every status
  console.info(`${GREEN}Booking lessons across every status...`);
  const now = new Date();
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  const statusCounts = new Map<string, number>();
  const teacherLabel = (id: string) => {
    if (id === testTeacher.id) return "test";
    if (id === approvalTeacher.id) return "approval";
    return "other";
  };

  for (const teacher of teachers) {
    const isTestTeacher = teacher.id === testTeacher.id || teacher.id === approvalTeacher.id;
    const teacherUserId = teacherUsers.find((u) => u.teacher?.id === teacher.id)!.id;

    for (const slot of slotsByTeacher.get(teacher.id) ?? []) {
      const isPast = slot.endTime <= now;
      const status = isPast ? pastStatusFor() : futureStatusFor(teacher.requireApproval);
      if (!status) continue;

      // give the test student some of the test teachers' lessons
      const student = pickFreeStudent(
        students,
        slot,
        isTestTeacher && faker.datatype.boolean() ? testStudent : undefined,
      );
      if (!student) continue;

      const lesson = await createLesson(slot, teacher, student, status);
      const key = `${teacherLabel(teacher.id)}:${status}`;
      statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);

      // same notifications the real flow would create. marked Sent so the
      // worker doesn't pick them up
      const when = `${subjectLabel(lesson.subject)} · ${formatSessionTime(slot.startTime, lesson.duration)}`;
      const base = {
        lessonId: lesson.id,
        status: NotificationStatus.Sent,
        sentAt: new Date(),
        body: when,
      };
      if (status === LessonStatus.Pending) {
        notifications.push({
          ...base,
          userId: teacherUserId,
          type: NotificationType.LessonRequested,
          title: `${student.name ?? "A student"} requested 1 lesson — please respond`,
        });
      } else if (status === LessonStatus.Confirmed || status === LessonStatus.Declined) {
        notifications.push({
          ...base,
          userId: student.userId,
          type:
            status === LessonStatus.Confirmed
              ? NotificationType.LessonConfirmed
              : NotificationType.LessonDeclined,
          title:
            status === LessonStatus.Confirmed
              ? `${teacher.name ?? "Your tutor"} confirmed your lesson`
              : `${teacher.name ?? "Your tutor"} couldn't take your lesson`,
          readAt: faker.datatype.boolean() ? new Date() : null,
        });
      } else if (status === LessonStatus.Upcoming) {
        notifications.push({
          ...base,
          userId: teacherUserId,
          type: NotificationType.LessonBooked,
          title: `${student.name ?? "A student"} booked 1 lesson`,
          readAt: faker.datatype.boolean() ? new Date() : null,
        });
      } else if (status === LessonStatus.Cancelled && !isPast) {
        notifications.push({
          ...base,
          userId: lesson.cancelledBy === Role.Teacher ? student.userId : teacherUserId,
          type: NotificationType.LessonCancelled,
          title: `${lesson.cancelledBy === Role.Teacher ? teacher.name : student.name} cancelled your lesson`,
          body: `${when}\nReason: ${lesson.cancelReason}`,
        });
      }
    }
  }

  await prisma.notification.createMany({ data: notifications });

  // 5. Earnings/hours from completed lessons' prices (what the worker would've added)
  console.info(`${GREEN}Calculating tutor earnings from completed lessons...`);
  for (const teacher of teachers) {
    const totals = await prisma.lesson.aggregate({
      where: { teacherId: teacher.id, status: LessonStatus.Completed },
      _sum: { priceAtBooking: true, duration: true },
    });
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        totalEarnings: totals._sum.priceAtBooking ?? 0,
        totalHours: (totals._sum.duration ?? 0) / 60,
      },
    });
  }

  // 6. Terminal output
  const count = (key: string) => statusCounts.get(key) ?? 0;
  const describe = (prefix: string, statuses: LessonStatus[]) =>
    statuses.map((s) => `${s} ${count(`${prefix}:${s}`)}`).join(" · ");

  console.info("\n-------------------------------------------------------");
  console.info(`${GREEN}🚀 Seed accounts (password for all: ${DEFAULT_PASSWORD})`);
  console.info(`\n👨‍🏫 teacher@test.com — instant booking (${testTeacher.name})`);
  console.info(
    `   ${describe("test", [LessonStatus.Upcoming, LessonStatus.Cancelled, LessonStatus.Completed])}`,
  );
  console.info(`\n👩‍🏫 approval.teacher@test.com — approves each booking (${approvalTeacher.name})`);
  console.info(
    `   ${describe("approval", [
      LessonStatus.Pending,
      LessonStatus.Confirmed,
      LessonStatus.Declined,
      LessonStatus.Completed,
    ])}`,
  );
  console.info(`\n🧑‍🎓 student@test.com (${testStudent.name})`);
  console.info(
    `   Subjects: ${testStudent.subjects.map((s) => `${subjectLabel(s.subject)} (${s.level})`).join(", ")}`,
  );
  console.info(`\n📬 ${notifications.length} notifications seeded`);
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
