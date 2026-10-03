import { ROUTES } from "./routes";

export const links = [
  { text: "Home", href: ROUTES.HOME },
  { text: "Subjects", href: ROUTES.SUBJECTS },
];

// lessons are 1h, 1.5h or 2h - keep in sync with LESSON_DURATIONS on the server
export const LESSON_DURATIONS = [60, 90, 120] as const;

export const isAllowedLessonDuration = (minutes: number): boolean =>
  (LESSON_DURATIONS as readonly number[]).includes(minutes);

// faded diagonal lines for time that's already gone (week grid + booking calendar)
export const pastTimeStripes = (spacingPx = 9) =>
  `repeating-linear-gradient(135deg, rgb(148 163 184 / 0.22) 0 1px, transparent 1px ${spacingPx}px)`;

// a window is only usable if one lesson length fills it exactly - no spare time
export const fitsWholeLessons = (windowMinutes: number): boolean =>
  windowMinutes >= LESSON_DURATIONS[0] &&
  LESSON_DURATIONS.some((length) => windowMinutes % length === 0);

// smallest window >= minutes (in 30 min steps) that fits whole lessons, e.g. 150 -> 180
export const snapWindowUp = (minutes: number): number => {
  let span = Math.max(minutes, LESSON_DURATIONS[0]);
  while (!fitsWholeLessons(span)) span += 30;
  return span;
};

// largest window <= minutes that fits whole lessons (0 if not even one lesson fits)
export const snapWindowDown = (minutes: number): number => {
  let span = Math.floor(minutes / 30) * 30;
  while (span > 0 && !fitsWholeLessons(span)) span -= 30;
  return span;
};

// lesson length for a window: the window itself if it's a valid length (1h, 1.5h, 2h),
// otherwise the longest length that divides it evenly (3h -> 1.5h, 4h -> 2h)
export const lessonLengthForWindow = (windowMinutes: number): number => {
  if (isAllowedLessonDuration(windowMinutes)) return windowMinutes;
  const fits = [...LESSON_DURATIONS].reverse().find((length) => windowMinutes % length === 0);
  return fits ?? LESSON_DURATIONS[0];
};

// "1h" / "1.5h" / "2h"
export const lessonLengthLabel = (minutes: number): string => `${minutes / 60}h`;
