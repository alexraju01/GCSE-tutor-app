import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@utils/cn";
import { addDaysToKey, formatDayKey } from "@utils/ukTime";
import type { BookingState } from "./useBookLessonModal";

// same faded diagonal lines the teacher's week grid uses for past time
const PAST_STRIPES =
  "repeating-linear-gradient(135deg, rgb(148 163 184 / 0.22) 0 1px, transparent 1px 7px)";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getDayCellClasses = (isPast: boolean, hasAvailability: boolean, isSelected: boolean): string => {
  if (isPast) return "cursor-not-allowed bg-slate-50/80 text-slate-300 dark:bg-slate-900/50 dark:text-slate-700";
  if (!hasAvailability) {
    return "cursor-not-allowed bg-slate-50/50 text-slate-400 dark:bg-slate-900/50 dark:text-slate-600";
  }
  if (isSelected) {
    return "cursor-pointer bg-linear-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-md";
  }
  return "cursor-pointer border border-blue-100/50 bg-blue-50/80 font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60";
};

const navButton =
  "cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800";

const BookingCalendar = ({ booking }: { booking: BookingState }) => {
  const {
    windowStartKey,
    calendarDays,
    groupedSlots,
    selectedDateKey,
    setSelectedDateKey: onSelectDate,
    selectedCountByDate,
    todayKey,
    canGoPrev,
    canGoNext,
    handlePrev: onPrev,
    handleNext: onNext,
  } = booking;
  const windowEndKey = addDaysToKey(windowStartKey, calendarDays.length - 1);
  const rangeLabel = `${formatDayKey(windowStartKey, { day: "numeric", month: "short" })} – ${formatDayKey(
    windowEndKey,
    { day: "numeric", month: "short", year: "numeric" },
  )}`;

  return (
    <div className="border-b border-slate-100 pb-6 dark:border-slate-800 lg:col-span-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">1. Select Date</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rangeLabel}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrev} disabled={!canGoPrev} aria-label="Earlier dates" className={navButton}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={onNext} disabled={!canGoNext} aria-label="Later dates" className={navButton}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-center">
        {WEEKDAY_LABELS.map((day) => (
          <span key={day} className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dateKey, index) => {
          const dayNumber = Number(dateKey.slice(8, 10));
          const isPast = dateKey < todayKey;
          const slotCount = isPast ? 0 : (groupedSlots[dateKey]?.length ?? 0);
          const hasAvailability = slotCount > 0;
          const isSelected = selectedDateKey === dateKey;
          const isToday = dateKey === todayKey;
          const pickedCount = selectedCountByDate[dateKey] || 0;
          // month name on the 1st (and the first cell) so month changes are obvious
          const showMonth = dayNumber === 1 || index === 0;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!hasAvailability}
              onClick={() => onSelectDate(dateKey)}
              aria-label={`${formatDayKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}${
                hasAvailability ? `, ${slotCount} ${slotCount === 1 ? "slot" : "slots"}` : ", no slots"
              }`}
              style={isPast ? { backgroundImage: PAST_STRIPES } : undefined}
              className={cn(
                "relative flex h-12 w-full flex-col items-center justify-center rounded-xl text-xs transition-all",
                isToday && "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900",
                getDayCellClasses(isPast, hasAvailability, isSelected),
              )}
            >
              {showMonth && (
                <span
                  className={cn(
                    "absolute left-1.5 top-1 text-[8px] font-bold uppercase tracking-wide",
                    isSelected ? "text-blue-100" : "text-blue-600 dark:text-blue-400",
                    isPast && "text-slate-300",
                  )}
                >
                  {formatDayKey(dateKey, { month: "short" })}
                </span>
              )}
              <span className="text-sm">{dayNumber}</span>
              {hasAvailability && (
                <span
                  className={cn(
                    "mt-0.5 rounded-full px-1 text-[9px] font-medium",
                    isSelected ? "bg-white/20 text-white" : "text-blue-600 dark:text-blue-400",
                  )}
                >
                  {slotCount} {slotCount === 1 ? "slot" : "slots"}
                </span>
              )}
              {isToday && !hasAvailability && (
                <span className="mt-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400">Today</span>
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
