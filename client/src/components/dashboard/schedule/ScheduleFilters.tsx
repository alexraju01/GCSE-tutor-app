import type { Route } from "next";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
} from "lucide-react";

interface ScheduleFiltersProps {
  activeFilter: StatusType;
  activeSort: SortDirection;
  selectedYear: number;
  selectedMonth?: number;
  formattedDateHeader: string;
}

export const FILTER_OPTIONS: { label: string; value: StatusType }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "Upcoming" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const ScheduleFilters = ({
  activeFilter,
  activeSort,
  selectedYear,
  selectedMonth,
  formattedDateHeader,
}: ScheduleFiltersProps) => {
  const isMonthlyView = selectedMonth !== undefined;
  const now = new Date();
  const isCurrentMonth =
    isMonthlyView &&
    selectedYear === now.getFullYear() &&
    selectedMonth === now.getMonth();

  const buildUrl = ({
    filter = activeFilter,
    sort = activeSort,
    year = selectedYear,
    month = selectedMonth,
  }: {
    filter?: StatusType;
    sort?: SortDirection;
    year?: number;
    month?: number;
  }) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.set("month", String(month + 1));
    params.set("year", String(year));
    params.set("filter", filter);
    params.set("sort", sort);
    params.set("page", "1");
    return `/dashboard/schedule?${params.toString()}` as Route;
  };

  const prevUrl = isMonthlyView
    ? buildUrl({
        year: selectedMonth === 0 ? selectedYear - 1 : selectedYear,
        month: (selectedMonth + 11) % 12,
      })
    : buildUrl({ year: selectedYear - 1 });

  const nextUrl = isMonthlyView
    ? buildUrl({
        year: selectedMonth === 11 ? selectedYear + 1 : selectedYear,
        month: (selectedMonth + 1) % 12,
      })
    : buildUrl({ year: selectedYear + 1 });

  const todayUrl = buildUrl({ year: now.getFullYear(), month: now.getMonth() });

  const toggleViewUrl = isMonthlyView
    ? buildUrl({ year: selectedYear, month: undefined })
    : buildUrl({ year: selectedYear, month: now.getMonth() });

  const sortUrl = buildUrl({ sort: activeSort === "asc" ? "desc" : "asc" });

  const getFilterClass = (filterName: StatusType) => {
    const base = "rounded-lg px-3 py-1.5 font-semibold text-xs transition-all";

    if (activeFilter === filterName)
      return `${base} bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm`;

    return `${base} border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800`;
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      {/* Date Navigation & View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={prevUrl}
          aria-label={isMonthlyView ? "Previous month" : "Previous year"}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={16} />
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
          <CalendarIcon size={14} className="text-blue-500" />
          <span>{formattedDateHeader}</span>
        </div>
        <Link
          href={nextUrl}
          aria-label={isMonthlyView ? "Next month" : "Next year"}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronRight size={16} />
        </Link>

        {isMonthlyView && !isCurrentMonth && (
          <Link
            href={todayUrl}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
          >
            Today
          </Link>
        )}

        <Link
          href={toggleViewUrl}
          className="ml-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {isMonthlyView ? "View All Year" : "View by Month"}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Sort toggle */}
        <Link
          href={sortUrl}
          title={
            activeSort === "asc"
              ? "Soonest first — click to reverse"
              : "Most recent first — click to reverse"
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {activeSort === "asc" ? (
            <ArrowUpNarrowWide size={14} />
          ) : (
            <ArrowDownNarrowWide size={14} />
          )}
          {activeSort === "asc" ? "Soonest first" : "Most recent first"}
        </Link>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1 pr-1 text-slate-400 dark:text-slate-500">
            <Filter size={14} /> Filter:
          </span>
          {FILTER_OPTIONS.map(({ label, value }) => (
            <Link
              key={value}
              href={buildUrl({ filter: value })}
              className={getFilterClass(value)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleFilters;
