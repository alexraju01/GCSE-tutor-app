import { BookOpen, CalendarRange, Inbox, Plus, Video } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buttonClass } from "@components/ui/styles";

interface QuickActionsCardProps {
  openSlots: number;
  bookedSlots: number;
  pendingRequests: number;
  lookaheadDays: number;
}

const toolLinkClass =
  "flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800";

const QuickActionsCard = ({ openSlots, bookedSlots, pendingRequests, lookaheadDays }: QuickActionsCardProps) => (
  <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    {pendingRequests > 0 && (
      <Link
        href={"/dashboard/schedule?filter=Pending" as Route}
        className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-xs text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        <Inbox size={18} className="shrink-0" />
        <span>
          <strong className="block text-sm">
            {pendingRequests} booking {pendingRequests === 1 ? "request" : "requests"} to review
          </strong>
          Students are waiting for you to accept or decline.
        </span>
      </Link>
    )}

    {/* Availability Section */}
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
        <CalendarRange className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        Availability
      </h3>

      <div className="mb-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/40">
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{openSlots}</p>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">open slots</p>
        </div>
        <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-950/40">
          <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{bookedSlots}</p>
          <p className="text-[11px] text-violet-700/80 dark:text-violet-300/80">booked</p>
        </div>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {openSlots === 0
          ? `You have no open slots in the next ${lookaheadDays} days — students can't book you until you add some.`
          : `Across the next ${lookaheadDays} days.`}
      </p>

      <Link
        href={"/dashboard/availability" as Route}
        className={buttonClass("primary", "md", "w-full py-2.5")}
      >
        <Plus size={15} />
        Manage availability
      </Link>
    </div>

    <hr className="border-slate-100 dark:border-slate-800" />

    {/* Quick Tools Section */}
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Quick Tools
      </h4>

      <div className="flex flex-col gap-2.5">
        <Link href={"/whiteboard" as Route} className={toolLinkClass}>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-100/80 p-1.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Video size={14} />
            </div>
            <span>Launch Collaborative Canvas</span>
          </div>
        </Link>

        <Link href={"/dashboard/teacher/profile" as Route} className={toolLinkClass}>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100/80 p-1.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <BookOpen size={14} />
            </div>
            <span>Subjects & booking rules</span>
          </div>
        </Link>
      </div>
    </div>
  </div>
);

export default QuickActionsCard;
