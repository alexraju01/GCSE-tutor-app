import { LessonStatus, Role } from "@generated/enums.js";
import { AppError } from "@utils/AppError.js";

// booking rules only - no db calls, so services and the worker can share them

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// lessons are 1h, 1.5h or 2h - also enforced by db check constraints
export const LESSON_DURATIONS = [60, 90, 120] as const;

export const isAllowedLessonDuration = (minutes: number): boolean =>
  (LESSON_DURATIONS as readonly number[]).includes(minutes);

export const LESSON_DURATION_MESSAGE = "Lessons must be 1 hour, 1.5 hours or 2 hours long.";

// these statuses hold the slot (and the student's time)
export const LIVE_STATUSES: LessonStatus[] = [
  LessonStatus.Pending,
  LessonStatus.Upcoming,
  LessonStatus.Confirmed,
];

// these free the slot up for someone else
export const RELEASED_STATUSES: LessonStatus[] = [LessonStatus.Cancelled, LessonStatus.Declined];

export interface BookingPolicy {
  minNoticeHours: number;
  maxAdvanceDays: number;
  cancellationCutoffHours: number;
}

export const assertSlotBookable = (
  startTime: Date,
  policy: BookingPolicy,
  now: Date = new Date(),
  label = "This slot",
): void => {
  if (startTime <= now) {
    throw new AppError(`${label} has already started and can no longer be booked.`, 400);
  }

  if (startTime.getTime() - now.getTime() < policy.minNoticeHours * HOUR_MS) {
    throw new AppError(
      `${label} is too soon — this tutor needs at least ${policy.minNoticeHours} hours' notice.`,
      400,
    );
  }

  if (startTime.getTime() - now.getTime() > policy.maxAdvanceDays * DAY_MS) {
    throw new AppError(
      `${label} is too far ahead — this tutor takes bookings up to ${policy.maxAdvanceDays} days in advance.`,
      400,
    );
  }
};

// same limits as assertSlotBookable, as a range for filtering slot queries
export const bookableWindow = (policy: BookingPolicy, now: Date = new Date()) => ({
  earliest: new Date(now.getTime() + policy.minNoticeHours * HOUR_MS),
  latest: new Date(now.getTime() + policy.maxAdvanceDays * DAY_MS),
});

export const assertLessonCancellable = (
  lesson: { status: LessonStatus; startTime: Date },
  cancellerRole: typeof Role.Student | typeof Role.Teacher,
  policy: Pick<BookingPolicy, "cancellationCutoffHours">,
  now: Date = new Date(),
): void => {
  if (!LIVE_STATUSES.includes(lesson.status)) {
    throw new AppError(`This lesson is already ${lesson.status.toLowerCase()}.`, 400);
  }

  if (lesson.startTime <= now) {
    throw new AppError("This lesson has already started and can no longer be cancelled.", 400);
  }

  // teachers decline requests rather than cancel them
  if (cancellerRole === Role.Teacher && lesson.status === LessonStatus.Pending) {
    throw new AppError("This is still a request — decline it instead of cancelling.", 400);
  }

  // cutoff only applies to students on agreed lessons - teachers can always
  // cancel, and a pending request can always be withdrawn
  if (cancellerRole === Role.Teacher || lesson.status === LessonStatus.Pending) return;

  if (lesson.startTime.getTime() - now.getTime() < policy.cancellationCutoffHours * HOUR_MS) {
    throw new AppError(
      `Lessons can't be cancelled within ${policy.cancellationCutoffHours} hours of the start. Please message your tutor instead.`,
      400,
    );
  }
};

// worker only updates statuses every few mins, so work it out on read too.
// an unanswered request past its start time counts as declined
export const getEffectiveStatus = (
  status: LessonStatus,
  startTime: Date,
  now: Date = new Date(),
): LessonStatus => {
  if (startTime > now) return status;
  if (status === LessonStatus.Pending) return LessonStatus.Declined;
  if (status === LessonStatus.Upcoming || status === LessonStatus.Confirmed) {
    return LessonStatus.Completed;
  }
  return status;
};

export const calculateLessonPrice = (hourlyRate: number, durationInMinutes: number): number =>
  Math.round(hourlyRate * durationInMinutes * (100 / 60)) / 100;
