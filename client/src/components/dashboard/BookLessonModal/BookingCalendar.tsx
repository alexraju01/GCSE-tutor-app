import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RawAvailability } from "./useBookLessonModal";

// Calendar grid cells are placeholder Dates with no real instant behind
// them, so this just reads their digits straight back rather than
// re-projecting via the UK-timezone Intl formatter.
const dateOnlyKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayCellClasses = (
  hasAvailability: boolean,
  isSelected: boolean,
): string => {
  if (!hasAvailability) {
    return "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40 bg-slate-50/50 dark:bg-slate-900/50";
  }
  if (isSelected) {
    return "bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md cursor-pointer scale-[1.02]";
  }
  return "bg-blue-50/80 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold cursor-pointer border border-blue-100/50 dark:border-blue-900/30";
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface BookingCalendarProps {
  currentMonth: Date;
  calendarDays: (Date | null)[];
  groupedSlots: Record<string, RawAvailability[]>;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  selectedCountByDate: Record<string, number>;
  todayKey: string;
  canGoPrevMonth: boolean;
  canGoNextMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const BookingCalendar = ({
  currentMonth,
  calendarDays,
  groupedSlots,
  selectedDateKey,
  onSelectDate,
  selectedCountByDate,
  todayKey,
  canGoPrevMonth,
  canGoNextMonth,
  onPrevMonth,
  onNextMonth,
}: BookingCalendarProps) => {
  return (
    <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          1. Select Date
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {currentMonth.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              disabled={!canGoPrevMonth}
              aria-label="Previous month"
              className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              disabled={!canGoNextMonth}
              aria-label="Next month"
              className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {WEEKDAY_LABELS.map((day) => (
          <span
            key={day}
            className="text-xs font-semibold text-slate-400 uppercase tracking-wide"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-12 w-full" />;
          }

          const dateKey = dateOnlyKey(date);
          const slotCount = groupedSlots[dateKey]?.length || 0;
          const hasAvailability = slotCount > 0;
          const isSelected = selectedDateKey === dateKey;
          const isToday = dateKey === todayKey;
          const pickedCount = selectedCountByDate[dateKey] || 0;

          return (
            <button
              key={idx}
              type="button"
              disabled={!hasAvailability}
              onClick={() => onSelectDate(dateKey)}
              className={`h-12 w-full rounded-xl text-xs flex flex-col items-center justify-center relative transition-all ${
                isToday
                  ? "ring-2 ring-offset-1 ring-blue-400 dark:ring-offset-slate-900"
                  : ""
              } ${getDayCellClasses(hasAvailability, isSelected)}`}
            >
              <span className="text-sm">{date.getDate()}</span>
              {hasAvailability && (
                <span
                  className={`text-[9px] mt-0.5 px-1 rounded-full font-medium ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {slotCount} {slotCount === 1 ? "slot" : "slots"}
                </span>
              )}
              {pickedCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white shadow-sm">
                  {pickedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookingCalendar;
