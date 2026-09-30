import { CalendarRange, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { buttonClass } from "@components/ui/styles";
import { ROUTES } from "@/constants/routes";

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
          href={ROUTES.DASHBOARD.AVAILABILITY as Route}
          className={buttonClass("primary")}
        >
          <CalendarRange size={16} />
          Manage availability
        </Link>
      ) : (
        <Link
          href="/teachers"
          className={buttonClass("primary")}
        >
          <Plus size={16} />
          Book new lesson
        </Link>
      )}
    </div>
  </div>
);

export default ScheduleHeader;
