import type { Route } from "next";
import Link from "next/link";

import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clock } from "lucide-react";

import { ROUTES, lessonRoute } from "@/constants/routes";

import StatusBadge from "@components/dashboard/StatusBadge";
import { buttonClass } from "@components/ui/styles";
import { requireSession } from "@utils/actions/session";
import { type GetLessonsParams, api } from "@utils/api";
import { formatScheduleDate, formatTimeRange } from "@utils/date";
import { formatSubject } from "@utils/format";

const PAGE_SIZE = 10;

const TABS = {
  upcoming: {
    label: "Upcoming",
    query: { scope: "upcoming", sort: "asc" },
    empty: "No upcoming lessons yet.",
  },
  completed: {
    label: "Completed",
    query: { status: "Completed", sort: "desc" },
    empty: "No completed lessons yet.",
  },
} satisfies Record<string, { label: string; query: GetLessonsParams; empty: string }>;

type Tab = keyof typeof TABS;

interface LessonsPageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

const lessonsHref = (tab: Tab, page = 1) =>
  `${ROUTES.DASHBOARD.LESSONS}?tab=${tab}${page > 1 ? `&page=${page}` : ""}` as Route;

const LessonsPage = async ({ searchParams }: LessonsPageProps) => {
  const params = await searchParams;
  const activeTab: Tab = params.tab === "completed" ? "completed" : "upcoming";
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { token, isTeacher } = await requireSession();

  const response = await api.lesson.getAll(token, {
    ...TABS[activeTab].query,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const lessons = response?.data ?? [];
  const totalPages = response?.pagination?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            My Lessons
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Open a lesson to see its details and join the classroom.
          </p>
        </div>

        {/* TABS */}
        <div
          role="tablist"
          className="flex items-center gap-1 self-start rounded-xl border border-slate-200/80 bg-white p-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
        >
          {(Object.keys(TABS) as Tab[]).map((tab) => (
            <Link
              key={tab}
              href={lessonsHref(tab)}
              role="tab"
              aria-selected={tab === activeTab}
              className={
                tab === activeTab
                  ? "rounded-lg bg-blue-600 px-3 py-1.5 text-white"
                  : "rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              }
            >
              {TABS[tab].label}
            </Link>
          ))}
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BookOpen size={18} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            {TABS[activeTab].empty}
          </p>
          {!isTeacher && activeTab === "upcoming" && (
            <Link href={ROUTES.TEACHERS as Route} className={buttonClass("primary", "md", "mt-4")}>
              Find a tutor
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} isTeacher={isTeacher} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
        >
          {currentPage > 1 ? (
            <Link
              href={lessonsHref(activeTab, currentPage - 1)}
              className={buttonClass("secondary", "sm")}
            >
              <ChevronLeft size={14} /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={lessonsHref(activeTab, currentPage + 1)}
              className={buttonClass("secondary", "sm")}
            >
              Next <ChevronRight size={14} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
};

const LessonCard = ({ lesson, isTeacher }: { lesson: Lesson; isTeacher: boolean }) => {
  const { startDate, formattedDate } = formatScheduleDate(lesson.startTime);
  const otherPerson = isTeacher ? lesson.student : lesson.teacher;

  return (
    <Link
      href={lessonRoute(lesson.id) as Route}
      className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-blue-500/40"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {formatSubject(lesson.subject)}
          </span>
          <StatusBadge status={lesson.status} />
        </div>
        <h3 className="font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
          {lesson.topic || "General session"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isTeacher ? "Student" : "Tutor"}:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {otherPerson?.name || "Unknown"}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock size={14} /> {formattedDate}, {formatTimeRange(startDate, lesson.duration)}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
          Details <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
};

export default LessonsPage;
