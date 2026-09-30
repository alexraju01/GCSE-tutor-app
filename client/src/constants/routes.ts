import { UserRole } from "@/types/role";

export const ROUTES = {
  //   NAV LINKS
  HOME: "/",
  SUBJECTS: "/subjects",
  TEACHERS: "/teachers",

  //  DASHBOARD
  DASHBOARD: {
    ROOT: "/dashboard",
    TEACHER: "/dashboard/teacher",
    STUDENT: "/dashboard/student",
    TEACHER_PROFILE: "/dashboard/teacher/profile",
    STUDENT_PROFILE: "/dashboard/student/profile",
    LESSONS: "/dashboard/lessons",
    SCHEDULE: "/dashboard/schedule",
    AVAILABILITY: "/dashboard/availability",
    MESSAGES: "/dashboard/messages",
    SETTINGS: "/dashboard/settings",
  },

  //   AUTH
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
} as const;

export const lessonRoute = (lessonId: string) =>
  `${ROUTES.DASHBOARD.LESSONS}/${encodeURIComponent(lessonId)}`;

// each role's home dashboard. undefined for a missing/unknown role so callers
// send them to sign-in instead of bouncing between the two dashboards
export const dashboardHomeFor = (role?: string) => {
  if (role === UserRole.Teacher) return ROUTES.DASHBOARD.TEACHER;
  if (role === UserRole.Student) return ROUTES.DASHBOARD.STUDENT;
  return undefined;
};

export const profileRouteFor = (role?: string) =>
  role === UserRole.Teacher
    ? ROUTES.DASHBOARD.TEACHER_PROFILE
    : ROUTES.DASHBOARD.STUDENT_PROFILE;
