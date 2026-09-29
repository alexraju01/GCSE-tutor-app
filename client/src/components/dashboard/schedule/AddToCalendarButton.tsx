"use client";

import { CalendarPlus } from "lucide-react";

import { cn } from "@utils/cn";
import { downloadIcs, type CalendarEvent } from "@utils/calendarInvite";

interface AddToCalendarButtonProps {
  events: CalendarEvent[];
  filename?: string;
  label?: string;
  className?: string;
}

const AddToCalendarButton = ({
  events,
  filename,
  label = "Add to calendar",
  className,
}: AddToCalendarButtonProps) => (
  <button
    type="button"
    onClick={() =>
      downloadIcs(
        // dates can come through as strings from server components
        events.map((event) => ({ ...event, start: new Date(event.start) })),
        filename,
      )
    }
    className={cn(
      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800",
      className,
    )}
  >
    <CalendarPlus size={14} /> {label}
  </button>
);

export default AddToCalendarButton;
