"use client";

import { CalendarPlus } from "lucide-react";

import { downloadIcs, type CalendarEvent } from "@utils/calendarInvite";
import { buttonClass } from "@components/ui/styles";

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
    className={buttonClass("secondary", "sm", className)}
  >
    <CalendarPlus size={14} /> {label}
  </button>
);

export default AddToCalendarButton;
