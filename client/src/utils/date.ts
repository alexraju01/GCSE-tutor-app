// @utils/date.ts

import { UK_TIME_ZONE } from "@utils/ukTime";

// Lesson times are real server instants, always displayed as UK time.
export const formatScheduleDate = (dateInput: string | Date) => {
  const startDate =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: UK_TIME_ZONE,
  });

  const startTimeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UK_TIME_ZONE,
  });

  return { startDate, formattedDate, startTimeStr };
};

export const formatTimeRange = (startDate: Date, durationMinutes: number) => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const startTimeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UK_TIME_ZONE,
  });

  const endTimeStr = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UK_TIME_ZONE,
  });

  return `${startTimeStr} - ${endTimeStr}`;
};

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
