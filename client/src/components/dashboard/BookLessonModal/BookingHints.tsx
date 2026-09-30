"use client";

import { Clock, Zap } from "lucide-react";
import { cn } from "@utils/cn";
import { addDaysToKey, formatUkDate, formatUkTime, toUkDateKey } from "@utils/ukTime";
import type { BookingState } from "./useBookLessonModal";

// "today at 21:35" / "tomorrow at 09:00" / "Fri 2 Oct at 09:00" (UK time)
const earliestBookable = (minNoticeHours: number) => {
  const earliest = new Date(Date.now() + minNoticeHours * 3_600_000);
  const todayKey = toUkDateKey(new Date());
  const dayKey = toUkDateKey(earliest);
  const time = formatUkTime(earliest);
  if (dayKey === todayKey) return `today at ${time}`;
  if (dayKey === addDaysToKey(todayKey, 1)) return `tomorrow at ${time}`;
  return `${formatUkDate(earliest, { weekday: "short", day: "numeric", month: "short" })} at ${time}`;
};

// explains why earlier slots (e.g. later today) aren't shown
export const MinimumNoticeNote = ({ booking }: { booking: BookingState }) => {
  const { policy, teacher } = booking;
  if (!policy || policy.minNoticeHours <= 0) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
      <Clock size={14} className="mt-0.5 shrink-0" />
      <span>
        {teacher.name ?? "This tutor"} needs at least {policy.minNoticeHours} hours&apos; notice, so the earliest
        you can book is <strong>{earliestBookable(policy.minNoticeHours)}</strong>.
      </span>
    </p>
  );
};

// quick picks for the next free slots
export const NextAvailable = ({ booking }: { booking: BookingState }) => {
  const { nextAvailable, selectedIds, pickSlot } = booking;

  return (
    <div>
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Zap size={12} /> Next available
      </span>
      <div className="flex flex-wrap gap-2">
        {nextAvailable.map((slot) => {
          const start = new Date(slot.startTime);
          const isSelected = selectedIds.has(slot.id);
          return (
            <button
              key={slot.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => pickSlot(slot)}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
            >
              <span className="block font-semibold">
                {formatUkDate(start, { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <span className={isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}>
                {formatUkTime(start)} – {formatUkTime(new Date(slot.endTime))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
