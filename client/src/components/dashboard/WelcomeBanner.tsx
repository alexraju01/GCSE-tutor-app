// WelcomeBanner.tsx
import { formatString } from "@utils/stringFormat";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export interface Subject {
  id: string | number;
  level?: string;
  subject?: string;
}

export interface WelcomeBannerProps {
  userName: string;
  role: "Teacher" | "Student";
  upcomingCount?: number;
  subjects?: Subject[];
  ctaLabel?: string;
  ctaHref?: Route;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const WelcomeBanner = ({
  userName,
  role,
  upcomingCount = 0,
  subjects = [],
  ctaLabel,
  ctaHref,
}: WelcomeBannerProps) => {
  const isTeacher = role === "Teacher";
  const RoleIcon = isTeacher ? Sparkles : GraduationCap;
  const roleLabel = isTeacher ? "Teacher Workspace" : "Student Workspace";
  const displayName = userName || (isTeacher ? "Teacher" : "Student");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-slate-900 sm:p-8">
      {/* Layered decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-blue-50 via-white to-indigo-50/60 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/20" />
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-linear-to-br from-blue-400/30 to-indigo-400/20 blur-3xl dark:from-blue-500/20 dark:to-indigo-500/10" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-linear-to-tr from-indigo-300/20 to-blue-200/10 blur-3xl dark:from-indigo-500/10 dark:to-blue-500/5" />
      <RoleIcon
        size={200}
        strokeWidth={1}
        className="pointer-events-none absolute -right-8 -bottom-10 text-blue-500/6 dark:text-blue-400/8"
      />

      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        {/* Main Text Content */}
        <div className="max-w-xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              <RoleIcon size={13} />
              {roleLabel}
            </div>

            {subjects.map(({ id, level: subLevel, subject }) => {
              const label = [formatString(subLevel), formatString(subject)]
                .filter(Boolean)
                .join(" ");

              return (
                <span
                  key={id}
                  className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                >
                  {label}
                </span>
              );
            })}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {getGreeting()}, {displayName}!
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {upcomingCount}
            </span>{" "}
            scheduled {upcomingCount === 1 ? "lesson" : "lessons"} coming up.
          </p>
        </div>

        {/* Primary Action */}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
          >
            {ctaLabel}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    </section>
  );
};

export default WelcomeBanner;
