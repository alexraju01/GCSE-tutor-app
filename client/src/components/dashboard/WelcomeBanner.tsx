// WelcomeBanner.tsx
import { formatString } from "@utils/stringFormat";
import { GraduationCap, Sparkles } from "lucide-react";

export interface Subject {
  id: string | number;
  level?: string;
  subject?: string;
}

export interface WelcomeBannerProps {
  userName: string;
  role: "Teacher" | "Student";
  upcomingCount?: number;
  pendingCount?: number;
  subjects?: Subject[];
}

const BASE_STYLES = {
  containerClasses:
    "border-blue-500/20 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-transparent sm:p-8",
  badgeClasses: "rounded-full border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  chipClasses:
    "rounded-full border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
};

const WelcomeBanner = ({
  userName,
  role,
  upcomingCount = 0,
  pendingCount = 0,
  subjects = [],
}: WelcomeBannerProps) => {
  const isTeacher = role === "Teacher";
  const RoleIcon = isTeacher ? Sparkles : GraduationCap;
  const roleLabel = isTeacher ? "Teacher Workspace" : "Student Workspace";

  const pendingText = isTeacher
    ? `and ${pendingCount} new lesson ${pendingCount === 1 ? "request" : "requests"}`
    : `and ${pendingCount} ${pendingCount === 1 ? "assignment" : "assignments"} awaiting completion.`;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border p-6 dark:border-blue-500/30 ${BASE_STYLES.containerClasses}`}
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        {/* Main Text Content */}
        <div className="relative z-10 max-w-xl space-y-2.5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold ${BASE_STYLES.badgeClasses}`}
            >
              <RoleIcon size={14} />
              {roleLabel}
            </div>

            {subjects.map(({ id, level: subLevel, subject }) => {
              const label = [formatString(subLevel), formatString(subject)]
                .filter(Boolean)
                .join(" ");

              return (
                <span
                  key={id}
                  className={`border px-2.5 py-0.5 text-xs font-medium text-slate-700 ${BASE_STYLES.chipClasses}`}
                >
                  {label}
                </span>
              );
            })}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Welcome back, {userName || (isTeacher ? "Teacher" : "Student")}!
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have {upcomingCount} scheduled {upcomingCount === 1 ? "lesson" : "lessons"} upcoming{" "}
            {pendingText}
          </p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeBanner;