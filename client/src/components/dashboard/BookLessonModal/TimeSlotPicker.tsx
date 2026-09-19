import { Check, Clock } from "lucide-react";
import { formatUkTime } from "@utils/ukTime";
import type { RawAvailability } from "./useBookLessonModal";

interface TimeSlotPickerProps {
  selectedDateKey: string | null;
  groupedSlots: Record<string, RawAvailability[]>;
  selectedIds: Set<string>;
  onToggleSlot: (slot: RawAvailability) => void;
}

const TimeSlotPicker = ({
  selectedDateKey,
  groupedSlots,
  selectedIds,
  onToggleSlot,
}: TimeSlotPickerProps) => {
  const slotsForDate = selectedDateKey ? groupedSlots[selectedDateKey] : null;

  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "border-transparent bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock
                      size={14}
                      className={isSelected ? "text-white" : "text-slate-400"}
                    />
                    <span>
                      {formatUkTime(start)} - {formatUkTime(end)}
                    </span>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-slate-400">
              Select a highlighted date to view time slots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
