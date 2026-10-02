// @utils/date.ts
import { formatUkDate, formatUkTime } from "@utils/ukTime";

// Lesson times are real server instants, always displayed as UK time.
export const formatScheduleDate = (dateInput: string | Date) => {
  const startDate = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // UK style like the rest of the app: "Thu 1 Oct 2026"
  const formattedDate = formatUkDate(startDate, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return { startDate, formattedDate, startTimeStr: formatUkTime(startDate) };
};

export const formatTimeRange = (startDate: Date, durationMinutes: number) => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${formatUkTime(startDate)}–${formatUkTime(endDate)}`;
};

// length of a slot/lesson in whole minutes
export const slotMinutes = (slot: { startTime: string | Date; endTime: string | Date }): number =>
  Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60_000);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Plain numbers picked from a filter, not a real instant — no timezone involved.
export const formatHeaderDate = (year: number, monthIndex?: number): string => {
  if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12) {
    return `${MONTH_NAMES[monthIndex]} ${year}`;
  }
  return `${year}`;
};
