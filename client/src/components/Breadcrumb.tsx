"use client";

import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";

const { DASHBOARD } = ROUTES;

const routeLabels: Record<string, string> = {
  [DASHBOARD.TEACHER]: "Overview",
  [DASHBOARD.STUDENT]: "Overview",
  [DASHBOARD.TEACHER_PROFILE]: "Profile",
  [DASHBOARD.STUDENT_PROFILE]: "Profile",
  [DASHBOARD.LESSONS]: "Lessons",
  [DASHBOARD.SCHEDULE]: "Schedule",
  [DASHBOARD.AVAILABILITY]: "Availability",
  [DASHBOARD.MESSAGES]: "Messages",
  [DASHBOARD.SETTINGS]: "Settings",
};

const Breadcrumb = () => {
  const pathname = usePathname();

  // Find exact match, otherwise a lesson page, otherwise format the subpath
  const currentSegment = pathname.split("/").filter(Boolean)[1] || "Overview";
  const formattedLabel =
    routeLabels[pathname] ||
    (pathname.startsWith(`${DASHBOARD.LESSONS}/`) && "Lesson details") ||
    currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);

  return (
    <h1 className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
      <span className="hidden sm:inline">Dashboard / </span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">{formattedLabel}</span>
    </h1>
  );
};

export default Breadcrumb;
