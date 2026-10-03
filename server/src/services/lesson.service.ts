import { LessonStatus, NotificationType, Prisma, Role, Subject } from "@generated/client.js";
import { formatSessionTime } from "@utils/date.js";
import { DB_CONSTRAINTS, isConstraintViolation } from "@utils/dbErrors.js";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  assertLessonCancellable,
  assertSlotBookable,
  calculateLessonPrice,
  getEffectiveStatus,
  isAllowedLessonDuration,
  LIVE_STATUSES,
} from "./booking.policy.js";
import { enqueueNotifications, type NotificationInput } from "./notification.service.js";
import type { GetLessonsQuery } from "../schemas/lesson.schema.js";

type Db = Prisma.TransactionClient;
type LessonActorRole = typeof Role.Student | typeof Role.Teacher;

const USER_SELECT = {
  name: true,
  image: true,
  email: true,
} as const;

const BASE_LESSON_SELECT = {
  id: true,
  subject: true,
  topic: true,
  startTime: true,
  duration: true,
  status: true,
  notes: true,
  priceAtBooking: true,
  cancelledAt: true,
  cancelledBy: true,
  cancelReason: true,
} as const;

// longest lesson is 2h - bounds how far back the overlap lookup needs to go
const MAX_LESSON_MINUTES = 120;
const MINUTE_MS = 60_000;

export const formatSubject = (subject: Subject): string => subject.replace(/_/g, " ");

export interface FindLessonsParams extends GetLessonsQuery {
  userId: string;
  role: LessonActorRole;
}

export interface CreateLessonParams {
  teacherId: string;
  availabilityId: string;
  subject: Subject;
  topic?: string;
  notes?: string;
}

// Builds a [gte, lt) range for the requested year, or year+month, in UTC.
// A month with no year is treated as that month in the current year, since
// "March" alone is ambiguous otherwise.
const buildDateRangeFilter = (year?: number, month?: number) => {
  if (year === undefined && month === undefined) return undefined;

  const rangeYear = year ?? new Date().getUTCFullYear();
  const startMonth = month !== undefined ? month - 1 : 0;
  const endMonth = month !== undefined ? month - 1 : 11;

  return {
    gte: new Date(Date.UTC(rangeYear, startMonth, 1)),
    lt: new Date(Date.UTC(rangeYear, endMonth + 1, 1)),
  };
};

// completed = marked Completed, or booked and already started (see
// getEffectiveStatus) - covers the gap before the worker catches up
export const effectivelyCompletedCondition = (now: Date = new Date()) => ({
  OR: [
    { status: LessonStatus.Completed },
    { status: { in: [LessonStatus.Upcoming, LessonStatus.Confirmed] }, startTime: { lte: now } },
  ],
});

// filters need to match getEffectiveStatus, otherwise a lesson can show as
// Completed but not turn up under the Completed filter
const buildStatusCondition = (status: LessonStatus | undefined, now: Date) => {
  if (!status) return undefined;

  if (status === LessonStatus.Completed) {
    return effectivelyCompletedCondition(now);
  }

  if (status === LessonStatus.Declined) {
    return {
      OR: [
        { status: LessonStatus.Declined },
        { status: LessonStatus.Pending, startTime: { lte: now } },
      ],
    };
  }

  // approved requests (Confirmed) are upcoming lessons too
  if (status === LessonStatus.Upcoming) {
    return {
      status: { in: [LessonStatus.Upcoming, LessonStatus.Confirmed] },
      startTime: { gt: now },
    };
  }

  if (LIVE_STATUSES.includes(status)) {
    return { status, startTime: { gt: now } };
  }

  return { status };
};

const canCancel = (
  lesson: { status: LessonStatus; startTime: Date },
  role: LessonActorRole,
  cancellationCutoffHours: number,
  now: Date,
): boolean => {
  try {
    assertLessonCancellable(lesson, role, { cancellationCutoffHours }, now);
    return true;
  } catch {
    return false;
  }
};

const serializeLesson = <
  T extends {
    status: LessonStatus;
    startTime: Date;
    priceAtBooking: Prisma.Decimal | null;
  },
>(
  lesson: T,
  role: LessonActorRole,
  cancellationCutoffHours: number,
  now: Date,
) => {
  const status = getEffectiveStatus(lesson.status, lesson.startTime, now);
  return {
    ...lesson,
    status,
    priceAtBooking: lesson.priceAtBooking === null ? null : Number(lesson.priceAtBooking),
    cancellationCutoffHours,
    canCancel: canCancel(
      { status, startTime: lesson.startTime },
      role,
      cancellationCutoffHours,
      now,
    ),
  };
};

export const findLessonsByRole = async ({
  userId,
  role,
  page,
  limit,
  status,
  subject,
  year,
  month,
  sort,
  scope,
}: FindLessonsParams) => {
  const isStudent = role === Role.Student;
  const skip = (page - 1) * limit;
  const dateRange = buildDateRangeFilter(year, month);
  const orderBy = [{ startTime: sort }, { id: sort }];
  const now = new Date();
  const statusCondition = buildStatusCondition(status, now);
  const scopeCondition =
    scope === "upcoming" ? { status: { in: LIVE_STATUSES }, startTime: { gt: now } } : undefined;
  const conditions = [statusCondition, scopeCondition].filter((c) => c !== undefined);

  const where = {
    ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    ...(subject && { subject }),
    ...(dateRange && { startTime: dateRange }),
    // A separate AND entry so this never collides with dateRange's own
    // startTime key above — both need to hold at once when both are set.
    ...(conditions.length > 0 && { AND: conditions }),
  };

  if (isStudent) {
    const [totalResults, rawLessons] = await Promise.all([
      prisma.lesson.count({ where }),
      prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          ...BASE_LESSON_SELECT,
          teacher: { select: { cancellationCutoffHours: true, user: { select: USER_SELECT } } },
        },
      }),
    ]);

    const lessons = rawLessons.map(({ teacher, ...lesson }) => ({
      ...serializeLesson(lesson, role, teacher.cancellationCutoffHours, now),
      teacher: teacher.user,
    }));

    return { lessons, totalResults };
  }

  const [totalResults, rawLessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        ...BASE_LESSON_SELECT,
        teacher: { select: { cancellationCutoffHours: true } },
        student: { select: { user: { select: USER_SELECT } } },
      },
    }),
  ]);

  const lessons = rawLessons.map(({ student, teacher, ...lesson }) => ({
    ...serializeLesson(lesson, role, teacher.cancellationCutoffHours, now),
    student: student.user,
  }));

  return { lessons, totalResults };
};

// one lesson, only if the user is its student or teacher. 404 (not 403) for
// someone else's lesson so ids can't be probed
export const findLessonForUser = async (
  lessonId: string,
  userId: string,
  role: LessonActorRole,
) => {
  const isStudent = role === Role.Student;
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      ...(isStudent ? { student: { userId } } : { teacher: { userId } }),
    },
    select: {
      ...BASE_LESSON_SELECT,
      teacher: { select: { cancellationCutoffHours: true, user: { select: USER_SELECT } } },
      student: { select: { user: { select: USER_SELECT } } },
    },
  });

  if (!lesson) throw new AppError("Lesson not found.", 404);

  const { teacher, student, ...rest } = lesson;
  return {
    ...serializeLesson(rest, role, teacher.cancellationCutoffHours, new Date()),
    teacher: teacher.user,
    student: student.user,
  };
};

// ---------------------------------------------------------------------------
// Cancelling and responding
// ---------------------------------------------------------------------------

const LESSON_PARTIES_SELECT = {
  id: true,
  status: true,
  startTime: true,
  duration: true,
  subject: true,
  availabilityId: true,
  student: { select: { userId: true, user: { select: { name: true } } } },
  teacher: {
    select: { userId: true, cancellationCutoffHours: true, user: { select: { name: true } } },
  },
} as const;

// only updates if the lesson is still in one of fromStatuses, so two
// cancels/responses at the same time can't both go through
const transitionLesson = async (
  db: Db,
  lessonId: string,
  fromStatuses: LessonStatus[],
  data: Prisma.LessonUpdateManyMutationInput,
) => {
  const { count } = await db.lesson.updateMany({
    where: { id: lessonId, status: { in: fromStatuses } },
    data,
  });

  if (count === 0) {
    throw new AppError("This lesson was just updated by someone else. Please refresh.", 409);
  }
};

export interface CancelLessonOptions {
  reason?: string;
  // teacher only - off by default, if they're cancelling they probably
  // can't teach then either
  reopenSlot?: boolean;
}

export const cancelLesson = async (
  lessonId: string,
  canceller: { userId: string; role: LessonActorRole },
  { reason, reopenSlot = false }: CancelLessonOptions = {},
) => {
  await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({
      where: { id: lessonId },
      select: LESSON_PARTIES_SELECT,
    });

    const isStudent = canceller.role === Role.Student;
    const ownerUserId = isStudent ? lesson?.student.userId : lesson?.teacher.userId;

    if (!lesson || ownerUserId !== canceller.userId) {
      throw new AppError("No lesson found with that ID.", 404);
    }

    assertLessonCancellable(lesson, canceller.role, lesson.teacher);

    await transitionLesson(tx, lessonId, LIVE_STATUSES, {
      status: LessonStatus.Cancelled,
      activeAvailabilityId: null,
      cancelledAt: new Date(),
      cancelledBy: canceller.role,
      cancelReason: reason ?? null,
    });

    if (!isStudent && !reopenSlot && lesson.availabilityId) {
      await tx.availability.delete({ where: { id: lesson.availabilityId } });
    }

    const when = formatSessionTime(lesson.startTime, lesson.duration);
    const cancellerName = (isStudent ? lesson.student.user.name : lesson.teacher.user.name) ?? "";
    const withdrawnRequest = lesson.status === LessonStatus.Pending;

    await enqueueNotifications(tx, [
      {
        userId: isStudent ? lesson.teacher.userId : lesson.student.userId,
        lessonId,
        type: NotificationType.LessonCancelled,
        title: withdrawnRequest
          ? `${cancellerName} withdrew their lesson request`
          : `${cancellerName} cancelled your lesson`,
        body: `${formatSubject(lesson.subject)} · ${when}${reason ? `\nReason: ${reason}` : ""}`,
      },
    ]);
  });
};

export type LessonDecision = "approve" | "decline";

export const respondToLessonRequest = async (
  lessonId: string,
  teacherUserId: string,
  decision: LessonDecision,
  reason?: string,
) => {
  await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findFirst({
      where: { id: lessonId, teacher: { userId: teacherUserId } },
      select: LESSON_PARTIES_SELECT,
    });

    if (!lesson) throw new AppError("No lesson found with that ID.", 404);

    if (lesson.status !== LessonStatus.Pending) {
      throw new AppError(
        `This lesson isn't awaiting a response — it's ${lesson.status.toLowerCase()}.`,
        400,
      );
    }
    if (lesson.startTime <= new Date()) {
      throw new AppError("This lesson request has expired.", 400);
    }

    const approved = decision === "approve";

    await transitionLesson(tx, lessonId, [LessonStatus.Pending], {
      status: approved ? LessonStatus.Confirmed : LessonStatus.Declined,
      respondedAt: new Date(),
      ...(!approved && { activeAvailabilityId: null, cancelReason: reason ?? null }),
    });

    const when = formatSessionTime(lesson.startTime, lesson.duration);
    const teacherName = lesson.teacher.user.name ?? "Your tutor";

    await enqueueNotifications(tx, [
      {
        userId: lesson.student.userId,
        lessonId,
        type: approved ? NotificationType.LessonConfirmed : NotificationType.LessonDeclined,
        title: approved
          ? `${teacherName} confirmed your lesson`
          : `${teacherName} couldn't take your lesson`,
        body: `${formatSubject(lesson.subject)} · ${when}${!approved && reason ? `\nReason: ${reason}` : ""}`,
      },
    ]);
  });
};

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export type BookingConflictReason =
  "not_found" | "wrong_teacher" | "slot_taken" | "policy" | "subject" | "student_overlap";

export interface BookingConflict {
  availabilityId: string;
  reason: BookingConflictReason;
  message: string;
}

// 409 if the student can fix it by picking other slots, 400 otherwise
const RETRYABLE_CONFLICTS: BookingConflictReason[] = ["slot_taken", "student_overlap", "not_found"];

const buildConflictError = (conflicts: BookingConflict[], total: number): AppError => {
  const statusCode = conflicts.every((c) => RETRYABLE_CONFLICTS.includes(c.reason)) ? 409 : 400;
  const message =
    total === 1
      ? conflicts[0].message
      : `${conflicts.length} of ${total} lessons can't be booked. ${conflicts[0].message}`;

  return new AppError(message, statusCode, { conflicts });
};

const BOOKED_LESSON_SELECT = {
  ...BASE_LESSON_SELECT,
  teacher: { select: { user: { select: USER_SELECT } } },
} as const;

const findLessonsByBookingRef = async (studentId: string, bookingRef: string) => {
  const lessons = await prisma.lesson.findMany({
    where: { studentId, bookingRef },
    orderBy: { startTime: "asc" },
    select: BOOKED_LESSON_SELECT,
  });

  return lessons.map(({ teacher, ...lesson }) => ({
    ...lesson,
    priceAtBooking: lesson.priceAtBooking === null ? null : Number(lesson.priceAtBooking),
    teacher: teacher.user,
  }));
};

const slotMinutes = (slot: { startTime: Date; endTime: Date }) =>
  Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / MINUTE_MS);

// books the whole batch or nothing. every item is checked up front so all
// conflicts come back together in error.details.conflicts.
// races are handled by the db constraints (activeAvailabilityId unique +
// student overlap exclusion), the error handler turns those into 409s
export const createLessonBookings = async (
  studentUserId: string,
  bookings: CreateLessonParams[],
  idempotencyKey?: string,
) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });

  if (!student) {
    throw new AppError("Student profile not found.", 404);
  }

  if (idempotencyKey) {
    const previous = await findLessonsByBookingRef(student.id, idempotencyKey);
    if (previous.length > 0) return { lessons: previous, replayed: true };
  }

  try {
    const lessons = await prisma.$transaction((tx) =>
      bookInTransaction(tx, student, bookings, idempotencyKey),
    );
    return { lessons, replayed: false };
  } catch (err) {
    // same request sent twice at once - return the one that won
    if (
      idempotencyKey &&
      (isConstraintViolation(err, DB_CONSTRAINTS.activeSlotBooking) ||
        isConstraintViolation(err, DB_CONSTRAINTS.studentLessonOverlap))
    ) {
      const previous = await findLessonsByBookingRef(student.id, idempotencyKey);
      if (previous.length > 0) return { lessons: previous, replayed: true };
    }
    throw err;
  }
};

const bookInTransaction = async (
  tx: Db,
  student: { id: string; userId: string; user: { name: string | null } },
  bookings: CreateLessonParams[],
  bookingRef?: string,
) => {
  const now = new Date();
  const availabilityIds = bookings.map((b) => b.availabilityId);

  const [slots, takenSlots] = await Promise.all([
    tx.availability.findMany({
      where: { id: { in: availabilityIds } },
      select: {
        id: true,
        teacherId: true,
        startTime: true,
        endTime: true,
        teacher: {
          select: {
            userId: true,
            hourlyRate: true,
            requireApproval: true,
            minNoticeHours: true,
            maxAdvanceDays: true,
            cancellationCutoffHours: true,
            user: { select: { name: true } },
            teaches: { select: { subject: true } },
          },
        },
      },
    }),
    tx.lesson.findMany({
      where: { activeAvailabilityId: { in: availabilityIds } },
      select: { activeAvailabilityId: true },
    }),
  ]);

  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const takenIds = new Set(takenSlots.map((l) => l.activeAvailabilityId));

  const studentLessons =
    slots.length === 0
      ? []
      : await tx.lesson.findMany({
          where: {
            studentId: student.id,
            status: { in: LIVE_STATUSES },
            startTime: {
              gt: new Date(
                Math.min(...slots.map((s) => s.startTime.getTime())) -
                  MAX_LESSON_MINUTES * MINUTE_MS,
              ),
              lt: new Date(Math.max(...slots.map((s) => s.endTime.getTime()))),
            },
          },
          select: { startTime: true, duration: true },
        });

  const busy = studentLessons.map((l) => ({
    start: l.startTime,
    end: new Date(l.startTime.getTime() + l.duration * MINUTE_MS),
  }));

  const conflicts: BookingConflict[] = [];

  for (const booking of bookings) {
    const addConflict = (reason: BookingConflictReason, message: string) =>
      conflicts.push({ availabilityId: booking.availabilityId, reason, message });

    const slot = slotById.get(booking.availabilityId);
    if (!slot) {
      addConflict("not_found", "One of the selected slots is no longer available.");
      continue;
    }

    const label = formatSessionTime(slot.startTime, slotMinutes(slot));

    if (slot.teacherId !== booking.teacherId) {
      addConflict("wrong_teacher", `The ${label} slot does not belong to this tutor.`);
      continue;
    }
    if (!isAllowedLessonDuration(slotMinutes(slot))) {
      addConflict("policy", `The ${label} slot isn't a 1, 1.5 or 2 hour lesson.`);
      continue;
    }
    if (takenIds.has(slot.id)) {
      addConflict("slot_taken", `The ${label} slot has just been booked by someone else.`);
      continue;
    }
    try {
      assertSlotBookable(slot.startTime, slot.teacher, now, `The ${label} slot`);
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
      addConflict("policy", err.message);
      continue;
    }
    if (!slot.teacher.teaches.some((t) => t.subject === booking.subject)) {
      addConflict("subject", `This tutor doesn't teach ${formatSubject(booking.subject)}.`);
      continue;
    }
    // busy includes earlier items in this batch too
    if (busy.some((b) => b.start < slot.endTime && slot.startTime < b.end)) {
      addConflict("student_overlap", `You already have a lesson during ${label}.`);
      continue;
    }

    busy.push({ start: slot.startTime, end: slot.endTime });
  }

  if (conflicts.length > 0) {
    throw buildConflictError(conflicts, bookings.length);
  }

  const lessons = [];
  // one notification per person per batch, not one per lesson
  const linesByTeacher = new Map<
    string,
    { teacher: (typeof slots)[number]["teacher"]; lines: string[] }
  >();

  for (const booking of bookings) {
    const slot = slotById.get(booking.availabilityId)!;
    const duration = slotMinutes(slot);

    const entry = linesByTeacher.get(slot.teacherId) ?? { teacher: slot.teacher, lines: [] };
    entry.lines.push(
      `${formatSubject(booking.subject)} · ${formatSessionTime(slot.startTime, duration)}`,
    );
    linesByTeacher.set(slot.teacherId, entry);

    const lesson = await tx.lesson.create({
      data: {
        studentId: student.id,
        teacherId: slot.teacherId,
        availabilityId: slot.id,
        activeAvailabilityId: slot.id,
        subject: booking.subject,
        topic: booking.topic,
        notes: booking.notes,
        startTime: slot.startTime,
        duration,
        priceAtBooking: calculateLessonPrice(Number(slot.teacher.hourlyRate), duration),
        bookingRef,
        status: slot.teacher.requireApproval ? LessonStatus.Pending : LessonStatus.Upcoming,
      },
      select: BOOKED_LESSON_SELECT,
    });

    lessons.push({
      ...lesson,
      priceAtBooking: lesson.priceAtBooking === null ? null : Number(lesson.priceAtBooking),
      teacher: lesson.teacher.user,
    });
  }

  await enqueueNotifications(
    tx,
    buildBookingNotifications(student, [...linesByTeacher.values()], lessons),
  );

  return lessons;
};

const buildBookingNotifications = (
  student: { userId: string; user: { name: string | null } },
  byTeacher: {
    teacher: { userId: string; requireApproval: boolean; user: { name: string | null } };
    lines: string[];
  }[],
  lessons: { id: string }[],
): NotificationInput[] => {
  const studentName = student.user.name ?? "A student";
  const count = (n: number) => `${n} lesson${n === 1 ? "" : "s"}`;
  const lessonId = lessons.length === 1 ? lessons[0].id : undefined;

  return byTeacher.flatMap(({ teacher, lines }) => {
    const tutorName = teacher.user.name ?? "your tutor";
    const body = lines.join("\n");

    return [
      {
        userId: teacher.userId,
        lessonId,
        type: teacher.requireApproval
          ? NotificationType.LessonRequested
          : NotificationType.LessonBooked,
        title: teacher.requireApproval
          ? `${studentName} requested ${count(lines.length)} — please respond`
          : `${studentName} booked ${count(lines.length)}`,
        body,
      },
      {
        userId: student.userId,
        lessonId,
        type: teacher.requireApproval
          ? NotificationType.LessonRequested
          : NotificationType.LessonBooked,
        title: teacher.requireApproval
          ? `Request sent to ${tutorName} — we'll let you know when they respond`
          : `You're booked with ${tutorName}`,
        body,
      },
    ];
  });
};
