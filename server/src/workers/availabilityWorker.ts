import { prisma } from "@db/prisma.js";
import { LessonStatus, NotificationType } from "@generated/client.js";
import { formatSessionTime } from "@utils/date.js";
import cron from "node-cron";
import { deliverPendingNotifications } from "../services/notification.delivery.js";

// every job checks status before updating, so overlapping runs (or two
// worker instances) can't apply the same change twice

const MINUTE_MS = 60_000;

// safe to delete any expired slot - lessons keep their own times and the fk is SET NULL
const purgeExpiredAvailabilities = async () => {
  const { count } = await prisma.availability.deleteMany({
    where: { endTime: { lt: new Date() } },
  });
  if (count > 0) console.info(`[Worker] Purged ${count} expired availability slots.`);
};

// mark finished lessons Completed and add them to the teacher's earnings/hours.
// the status check in updateMany makes sure each lesson is only counted once
const completeFinishedLessons = async () => {
  const now = new Date();
  const candidates = await prisma.lesson.findMany({
    where: {
      status: { in: [LessonStatus.Upcoming, LessonStatus.Confirmed] },
      startTime: { lte: now },
    },
    select: { id: true, teacherId: true, startTime: true, duration: true, priceAtBooking: true },
    take: 200,
  });

  const finished = candidates.filter(
    (lesson) => lesson.startTime.getTime() + lesson.duration * MINUTE_MS <= now.getTime(),
  );

  let completed = 0;
  for (const lesson of finished) {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.lesson.updateMany({
        where: { id: lesson.id, status: { in: [LessonStatus.Upcoming, LessonStatus.Confirmed] } },
        data: { status: LessonStatus.Completed },
      });
      if (count === 0) return;

      await tx.teacher.update({
        where: { id: lesson.teacherId },
        data: {
          totalHours: { increment: lesson.duration / 60 },
          totalEarnings: { increment: lesson.priceAtBooking ?? 0 },
        },
      });
      completed++;
    });
  }

  if (completed > 0) console.info(`[Worker] Marked ${completed} lessons as completed.`);
};

// requests the teacher never answered get declined once the start time passes
const expireUnansweredRequests = async () => {
  const expired = await prisma.lesson.findMany({
    where: { status: LessonStatus.Pending, startTime: { lte: new Date() } },
    select: {
      id: true,
      subject: true,
      startTime: true,
      duration: true,
      student: { select: { userId: true } },
      teacher: { select: { user: { select: { name: true } } } },
    },
    take: 200,
  });

  for (const lesson of expired) {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.lesson.updateMany({
        where: { id: lesson.id, status: LessonStatus.Pending },
        data: {
          status: LessonStatus.Declined,
          activeAvailabilityId: null,
          respondedAt: new Date(),
          cancelReason: "The tutor didn't respond before the lesson time.",
        },
      });
      if (count === 0) return;

      await tx.notification.create({
        data: {
          userId: lesson.student.userId,
          lessonId: lesson.id,
          type: NotificationType.LessonDeclined,
          title: `${lesson.teacher.user.name ?? "Your tutor"} didn't respond to your request in time`,
          body: `${lesson.subject.replace(/_/g, " ")} · ${formatSessionTime(lesson.startTime, lesson.duration)}\nYou haven't been charged. Please book another time.`,
        },
      });
    });
  }
};

const runJob = async (name: string, job: () => Promise<unknown>) => {
  try {
    await job();
  } catch (error) {
    console.error(`[Worker] ${name} failed:`, error);
  }
};

const runScheduledJobs = async () => {
  await runJob("expireUnansweredRequests", expireUnansweredRequests);
  await runJob("completeFinishedLessons", completeFinishedLessons);
  await runJob("purgeExpiredAvailabilities", purgeExpiredAvailabilities);
};

export const startAvailabilityWorker = (): void => {
  console.info(
    "[Worker] Scheduling worker running (housekeeping every 5 min, notifications every min).",
  );

  void runScheduledJobs();
  void runJob("deliverPendingNotifications", deliverPendingNotifications);

  cron.schedule("*/5 * * * *", () => {
    void runScheduledJobs();
  });

  cron.schedule("* * * * *", () => {
    void runJob("deliverPendingNotifications", deliverPendingNotifications);
  });
};

// Run directly if invoked as entrypoint
startAvailabilityWorker();
