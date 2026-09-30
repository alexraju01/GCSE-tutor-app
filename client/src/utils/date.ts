// @utils/date.ts

import { UK_TIME_ZONE } from "@utils/ukTime";

// "4:00 PM" in UK time - used by the schedule cards
const ukTime12h = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UK_TIME_ZONE,
  });

// Lesson times are real server instants, always displayed as UK time.
export const formatScheduleDate = (dateInput: string | Date) => {
  const startDate = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: UK_TIME_ZONE,
  });

  return { startDate, formattedDate, startTimeStr: ukTime12h(startDate) };
};

export const formatTimeRange = (startDate: Date, durationMinutes: number) => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${ukTime12h(startDate)} - ${ukTime12h(endDate)}`;
};

// length of a slot/lesson in whole minutes
export const slotMinutes = (slot: { startTime: string | Date; endTime: string | Date }): number =>
  Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60_000);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Plain numbers picked from a filter, not a real instant — no timezone involved.
export const formatHeaderDate = (year: number, monthIndex?: number): string => {
  if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12) {
    return `${MONTH_NAMES[monthIndex]} ${year}`;
  }
  return `${year}`;
};
