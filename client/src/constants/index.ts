import { ROUTES } from "./routes";

export const links = [
  { text: "Home", href: ROUTES.HOME },
  { text: "Subjects", href: ROUTES.SUBJECTS },
];

// lessons are 1h, 1.5h or 2h - keep in sync with LESSON_DURATIONS on the server
export const LESSON_DURATIONS = [60, 90, 120] as const;

export const isAllowedLessonDuration = (minutes: number): boolean =>
  (LESSON_DURATIONS as readonly number[]).includes(minutes);
