import { CalendarRange, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

interface ScheduleHeaderProps {
  isTeacher: boolean;
}

const ScheduleHeader = ({ isTeacher }: ScheduleHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        Schedule & Bookings
      </h1>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Manage your upcoming live tutoring sessions and past lessons.
      </p>
    </div>

    <div className="flex items-center gap-3">
      {isTeacher ? (
        <Link
          href={"/dashboard/availability" as Route}
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
        >
          <CalendarRange size={16} />
          Manage Availability
        </Link>
      ) : (
        <Link
          href="/teachers"
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
        >
          <Plus size={16} />
          Book New Lesson
        </Link>
      )}
    </div>
  </div>
);

export default ScheduleHeader;
