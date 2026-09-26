// @utils/date.ts

// Without an explicit timeZone, Node formats using the server process's own
// timezone, not the UK's — these format real DB instants, so pin it.
const UK_TIME_ZONE = "Europe/London";

const ukDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ukPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Converts a UK wall-clock date/time (month is 1-12) into the real instant,
// accounting for GMT/BST — mirrors the client's ukWallClockToIsoString.
export const ukWallClockToDate = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): Date => {
  // Guess UTC, see what that reads as in the UK, then correct by the offset.
  const guessUtc = Date.UTC(year, month - 1, day, hours, minutes);
  const parts: Record<string, number> = {};
  for (const part of ukPartsFormatter.formatToParts(new Date(guessUtc))) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour % 24, // Intl can format midnight as "24"
    parts.minute,
    parts.second,
  );

  return new Date(guessUtc + (guessUtc - asIfUtc));
};

export const formatDateLabel = (startTime: Date): string => {
  return startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: UK_TIME_ZONE,
  });
};

export const formatTimeSlot = (startTime: Date, durationMinutes: number): string => {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const startFormatted = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UK_TIME_ZONE,
  });

  const endFormatted = endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UK_TIME_ZONE,
  });

  return `${startFormatted} - ${endFormatted}`;
};

export const formatDurationLabel = (durationMinutes: number): string => {
  const hours = durationMinutes / 60;
  return hours === 1 ? "1 hr" : `${hours} hrs`;
};

export const formatSessionTime = (startTime: Date, durationMinutes: number): string => {
  // Compare UK calendar-day keys, not toDateString() (server's own timezone).
  const isToday = ukDateKeyFormatter.format(startTime) === ukDateKeyFormatter.format(new Date());
  const dayLabel = isToday ? "Today" : formatDateLabel(startTime);
  const slot = formatTimeSlot(startTime, durationMinutes);

  return `${dayLabel}, ${slot}`;
};

export const formatScheduleDate = (dateInput: string | Date) => {
  const startDate = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

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
