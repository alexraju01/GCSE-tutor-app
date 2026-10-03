import { ukWallClockToDate } from "@utils/date.js";

// weekly pattern -> slots, no db code in here

export interface RecurringPattern {
  days: number[]; // 0 = Monday … 6 = Sunday
  startDate: string; // UK "YYYY-MM-DD"
  from: string; // UK "HH:mm"
  to: string; // UK "HH:mm"
  lessonLength: number;
  weeks: number;
  exclude?: string[]; // "YYYY-MM-DD|HH:mm"
}

export const MAX_RECURRING_SLOTS = 200;
export const DAY_MS = 86_400_000;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toHHMM = (totalMinutes: number): string =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;

// turns a weekly pattern (UK time) into future slots, splitting each day's
// window into back-to-back lessons
export const expandRecurringPattern = (pattern: RecurringPattern, now: Date = new Date()) => {
  const [year, month, day] = pattern.startDate.split("-").map(Number);
  const startMs = Date.UTC(year, month - 1, day);
  const startDayIndex = (new Date(startMs).getUTCDay() + 6) % 7;
  const mondayMs = startMs - startDayIndex * DAY_MS;
  const fromMinutes = toMinutes(pattern.from);
  const toMinutesValue = toMinutes(pattern.to);
  const excluded = new Set(pattern.exclude ?? []);
  const days = [...pattern.days].sort((a, b) => a - b);

  const slots: { key: string; startTime: Date; endTime: Date }[] = [];

  for (let week = 0; week < pattern.weeks; week++) {
    for (const dayIndex of days) {
      const dateMs = mondayMs + (week * 7 + dayIndex) * DAY_MS;
      if (dateMs < startMs) continue;

      const date = new Date(dateMs);
      const dateKey = date.toISOString().slice(0, 10);

      for (
        let start = fromMinutes;
        start + pattern.lessonLength <= toMinutesValue;
        start += pattern.lessonLength
      ) {
        const key = `${dateKey}|${toHHMM(start)}`;
        if (excluded.has(key)) continue;

        const startTime = ukWallClockToDate(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
          Math.floor(start / 60),
          start % 60,
        );
        if (startTime <= now) continue;

        slots.push({
          key,
          startTime,
          endTime: new Date(startTime.getTime() + pattern.lessonLength * 60_000),
        });
      }
    }
  }

  return slots;
};
