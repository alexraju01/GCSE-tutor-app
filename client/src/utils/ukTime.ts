// This app only operates in the UK — all timezone math should go through
// these helpers instead of raw Date/toLocaleDateString/toISOString calls.

export const UK_TIME_ZONE = "Europe/London";

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

const partsToRecord = (parts: Intl.DateTimeFormatPart[]): Record<string, string> =>
  parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});

// "YYYY-MM-DD" for the UK calendar day a real instant falls on.
export const toUkDateKey = (date: Date): string => ukDateKeyFormatter.format(date);

// Year/month/day/hour/minute (month is 1-12) the UK wall clock reads for a
// real instant.
export const getUkDateParts = (
  date: Date,
): { year: number; month: number; day: number; hour: number; minute: number } => {
  const parts = partsToRecord(ukPartsFormatter.formatToParts(date));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24, // Intl can format midnight as "24"
    minute: Number(parts.minute),
  };
};

// A Date whose local getters/setters read as the current UK wall-clock time.
// Its own instant is meaningless — use only for calendar arithmetic, never
// for comparing against a real instant.
export const nowInUk = (): Date => {
  const parts = partsToRecord(ukPartsFormatter.formatToParts(new Date()));
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24, // Intl can format midnight as "24"
    Number(parts.minute),
    Number(parts.second),
  );
};

// Converts a UK wall-clock date/time into the real UTC instant, accounting
// for GMT/BST.
export const ukWallClockToIsoString = (
  year: number,
  month: number, // 1-12
  day: number,
  hours: number,
  minutes: number,
): string => {
  // Guess UTC, see what that reads as in the UK, then correct by the offset.
  const guessUtc = Date.UTC(year, month - 1, day, hours, minutes);
  const parts = partsToRecord(ukPartsFormatter.formatToParts(new Date(guessUtc)));
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return new Date(guessUtc + (guessUtc - asIfUtc)).toISOString();
};

// toLocaleDateString/toLocaleTimeString pinned to UK time.
export const formatUkDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
): string => date.toLocaleDateString("en-GB", { ...options, timeZone: UK_TIME_ZONE });

export const formatUkTime = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {},
): string =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
    timeZone: UK_TIME_ZONE,
  });

// day keys are "YYYY-MM-DD" UK dates - doing the maths on keys instead of
// instants means GMT/BST changes can't shift anything

const DAY_MS = 86_400_000;

const parseKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
};

export const addDaysToKey = (key: string, days: number): string => {
  const { year, month, day } = parseKey(key);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
};

// 0 = Monday … 6 = Sunday
export const dayIndexOfKey = (key: string): number => {
  const { year, month, day } = parseKey(key);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
};

// monday of the week `date` is in
export const ukWeekStartKey = (date: Date): string => {
  const key = toUkDateKey(date);
  return addDaysToKey(key, -dayIndexOfKey(key));
};

// UK day key + minutes -> real Date
export const ukInstant = (key: string, minutesOfDay = 0): Date => {
  const { year, month, day } = parseKey(key);
  return new Date(
    ukWallClockToIsoString(year, month, day, Math.floor(minutesOfDay / 60), minutesOfDay % 60),
  );
};

// minutes since UK midnight
export const ukMinutesOfDay = (date: Date): number => {
  const { hour, minute } = getUkDateParts(date);
  return hour * 60 + minute;
};

export const minutesToHHMM = (totalMinutes: number): string =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;

export const hhmmToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const formatDayKey = (key: string, options: Intl.DateTimeFormatOptions): string =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });

// true if the user isn't on UK time, so we can show their local time too
export const viewerIsOutsideUk = (): boolean =>
  typeof Intl !== "undefined" &&
  Intl.DateTimeFormat().resolvedOptions().timeZone !== UK_TIME_ZONE &&
  new Date().getTimezoneOffset() !== -getUkOffsetMinutes(new Date());

const getUkOffsetMinutes = (date: Date): number => {
  const { year, month, day, hour, minute } = getUkDateParts(date);
  return Math.round((Date.UTC(year, month - 1, day, hour, minute) - date.getTime()) / 60_000);
};
