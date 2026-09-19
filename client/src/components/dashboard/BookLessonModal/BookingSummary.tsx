import { X } from "lucide-react";
import { formatUkDate, formatUkTime } from "@utils/ukTime";
import type { RawAvailability } from "./useBookLessonModal";

interface BookingSummaryProps {
  selectedSlots: RawAvailability[];
  subject: string;
  estimatedCost: number;
  onRemoveSlot: (slot: RawAvailability) => void;
}

const BookingSummary = ({
  selectedSlots,
  subject,
  estimatedCost,
  onRemoveSlot,
}: BookingSummaryProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Booking Summary
      </span>
      {selectedSlots.length > 0 && subject ? (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Subject</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {subject}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Lessons</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedSlots.length}
            </span>
          </div>
          <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
            {selectedSlots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2 py-1 dark:bg-slate-900/60"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatUkDate(new Date(slot.startTime), {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  , {formatUkTime(new Date(slot.startTime))}
                  {" - "}
                  {formatUkTime(new Date(slot.endTime))}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSlot(slot)}
                  aria-label="Remove lesson"
                  className="shrink-0 cursor-pointer text-slate-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Estimated cost
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              £{estimatedCost.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Pick a date, time, and subject to see your booking summary.
        </p>
      )}
    </div>
  );
};

export default BookingSummary;
