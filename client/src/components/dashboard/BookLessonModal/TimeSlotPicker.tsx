import { useSyncExternalStore } from "react";

import { Check, Clock } from "lucide-react";

import { formatUkTimeRange, viewerIsOutsideUk } from "@utils/ukTime";

import type { BookingState } from "./useBookLessonModal";

const subscribeNever = () => () => {};

const localTime = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

const TimeSlotPicker = ({ booking }: { booking: BookingState }) => {
  const { selectedDateKey, groupedSlots, selectedIds, toggleSlot: onToggleSlot } = booking;
  const slotsForDate = selectedDateKey ? groupedSlots[selectedDateKey] : null;
  // timezone is only known in the browser, false on the server avoids a hydration mismatch
  const showLocal = useSyncExternalStore(subscribeNever, viewerIsOutsideUk, () => false);

  return (
    <div>
      <span className="mb-3 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
        2. Select Time Slots (pick as many as you like)
      </span>

      {/* Fixed height regardless of slot count or selection state, so
          switching days never shifts the layout below it. */}
      <div className="h-[180px] overflow-y-auto pr-1">
        {slotsForDate ? (
          <div className="space-y-2">
            {slotsForDate.map((slot) => {
              const isSelected = selectedIds.has(slot.id);
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onToggleSlot(slot)}
                  aria-pressed={isSelected}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-xs transition-all ${
                    isSelected
                      ? "border-transparent bg-linear-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-sm"
                      : "border-slate-200 bg-slate-50/50 text-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock size={14} className={isSelected ? "text-white" : "text-slate-400"} />
                    <span>
                      {formatUkTimeRange(start, end)}
                      {showLocal && (
                        <span
                          className={`ml-1.5 font-normal ${isSelected ? "text-blue-100" : "text-slate-400"}`}
                        >
                          ({localTime(start)} your time)
                        </span>
                      )}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-slate-400">Select a highlighted date to view time slots.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
