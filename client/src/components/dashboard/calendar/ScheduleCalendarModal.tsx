"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import SetAvailabilityModal from "./SetAvailabilityModal";
import { TimeSlot } from "@utils/actions/availability";
import { api } from "@utils/api";
import { nowInUk, ukWallClockToIsoString } from "@utils/ukTime";

interface ScheduleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlots?: TimeSlot[];
  token?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);
  d.setHours(0, 0, 0, 0);

  return d;
};

// `dayDate` is nowInUk()-seeded, so its local digits are already UK time.
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const ScheduleCalendarModal = ({
  isOpen,
  onClose,
  initialSlots = [],
  token,
}: ScheduleCalendarModalProps) => {
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getMonday(nowInUk()),
  );

  const [prevInitialSlots, setPrevInitialSlots] =
    useState<TimeSlot[]>(initialSlots);
  const [availabilitySlots, setAvailabilitySlots] =
    useState<TimeSlot[]>(initialSlots);

  if (prevInitialSlots !== initialSlots) {
    setPrevInitialSlots(initialSlots);
    setAvailabilitySlots(initialSlots);
  }

  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    date: string;
  } | null>(null);

  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(
    new Set(),
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(currentWeekStart.getDate() + index);
      const isoDate = formatDateKey(dayDate);

      return {
        dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        fullDayName: dayDate.toLocaleDateString("en-US", { weekday: "long" }),
        dayNumber: dayDate.getDate(),
        isoDate,
        isToday: isoDate === formatDateKey(nowInUk()),
        rawDate: dayDate,
      };
    });
  }, [currentWeekStart]);

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  const startMonth = currentWeekStart.toLocaleDateString("en-US", {
    month: "short",
  });
  const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
  const yearLabel = currentWeekStart.getFullYear();
  const rangeHeaderLabel =
    startMonth === endMonth
      ? `${startMonth} ${currentWeekStart.getDate()} – ${weekEnd.getDate()}, ${yearLabel}`
      : `${startMonth} ${currentWeekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${yearLabel}`;

  const handlePreviousWeek = () => {
    const previous = new Date(currentWeekStart);
    previous.setDate(previous.getDate() - 7);
    setCurrentWeekStart(previous);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    setCurrentWeekStart(getMonday(nowInUk()));
  };

  // A cell with existing availability toggles removal selection; an empty
  // future cell opens the "add availability" modal instead.
  const handleCellClick = (
    fullDayName: string,
    hour: number,
    isoDate: string,
    isPast: boolean,
    activeAvailability: TimeSlot | undefined,
  ) => {
    if (isPast) return;

    if (activeAvailability) {
      setRemoveError(null);
      setSelectedForRemoval((prev) => {
        const next = new Set(prev);
        if (next.has(activeAvailability.id)) {
          next.delete(activeAvailability.id);
        } else {
          next.add(activeAvailability.id);
        }
        return next;
      });
      return;
    }

    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

    setSelectedSlot({
      dayOfWeek: fullDayName,
      startTime,
      endTime,
      date: isoDate,
    });

    setIsAvailabilityModalOpen(true);
  };

  const handleRemoveSelected = async () => {
    if (selectedForRemoval.size === 0 || !token) return;

    setIsRemoving(true);
    setRemoveError(null);

    try {
      const ids = Array.from(selectedForRemoval);
      await api.availability.removeMany(ids, token);

      setAvailabilitySlots((prev) =>
        prev.filter((slot) => !selectedForRemoval.has(slot.id)),
      );
      setSelectedForRemoval(new Set());
    } catch (err: unknown) {
      console.error("Failed to remove availability:", err);
      setRemoveError(
        err instanceof Error
          ? err.message
          : "Failed to remove the selected slots.",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAvailabilitySuccess = (newSlots: TimeSlot[]) => {
    setAvailabilitySlots((previousSlots) => {
      const combined = [...previousSlots, ...newSlots];

      return combined.filter(
        (slot, index, array) =>
          index ===
          array.findIndex((other) =>
            slot.id && other.id
              ? slot.id === other.id
              : slot.date === other.date &&
                slot.startTime === other.startTime &&
                slot.endTime === other.endTime,
          ),
      );
    });
  };

  const getActiveAvailability = (day: { isoDate: string }, hour: number) => {
    return availabilitySlots.find((slot) => {
      if (!slot.startTime) return false;

      let slotIsoDate = "";
      let startHour = -1;
      let endHour = -1;

      if (slot.startTime.includes("T")) {
        const [datePart, timePart] = slot.startTime.split("T");
        const [endTimePart] = slot.endTime
          ? slot.endTime.split("T").slice(1)
          : ["00:00"];

        slotIsoDate = datePart;
        startHour = parseInt(timePart.split(":")[0], 10);
        endHour = parseInt(endTimePart.split(":")[0], 10);
      } else {
        slotIsoDate = slot.date || "";
        startHour = parseInt(slot.startTime.split(":")[0], 10);
        endHour = parseInt(slot.endTime.split(":")[0], 10);
      }

      const matchesDate = slotIsoDate === day.isoDate;
      const matchesTime = hour >= startHour && hour < endHour;

      return matchesDate && matchesTime;
    });
  };

  const handleClose = () => {
    // Otherwise a stale "N selected" bar (and error) reappears next open —
    // this component doesn't unmount between opens, isOpen just toggles.
    setSelectedForRemoval(new Set());
    setRemoveError(null);
    onClose();
  };

  if (!isOpen) return null;

  const now = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Teacher Availability
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Click an empty slot to add availability, or click an existing
              one to select it for removal.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 cursor-pointer text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {removeError && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{removeError}</span>
          </div>
        )}

        {selectedForRemoval.size > 0 && (
          <div className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/60 p-3 dark:border-red-900 dark:bg-red-950/30">
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
              {selectedForRemoval.size}{" "}
              {selectedForRemoval.size === 1 ? "slot" : "slots"} selected for
              removal
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedForRemoval(new Set())}
                disabled={isRemoving}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveSelected}
                disabled={isRemoving}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isRemoving
                  ? "Removing..."
                  : `Remove ${selectedForRemoval.size}`}
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePreviousWeek}
                className="rounded-lg border cursor-pointer border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="rounded-lg border cursor-pointer border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg border cursor-pointer border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Today
            </button>

            <span className="ml-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              {rangeHeaderLabel}
            </span>
          </div>

          {/* LEGEND */}
          <div className="hidden items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 sm:flex">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Availability Set</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-50 dark:bg-slate-800/40 bg-[repeating-linear-gradient(135deg,rgba(203,213,225,0.4)_0,rgba(203,213,225,0.4)_1px,transparent_0,transparent_10px)] dark:bg-[repeating-linear-gradient(135deg,rgba(51,65,85,0.4)_0,rgba(51,65,85,0.4)_1px,transparent_0,transparent_10px)]" />
              <span>Unavailable / Past</span>
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="flex-1 overflow-auto p-5">
          <div className="min-w-200 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            {/* DAY HEADER */}
            <div className="grid grid-cols-8 border-b border-slate-200/80 bg-slate-50 text-center text-xs font-semibold text-slate-700 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-300">
              <div className="flex items-center justify-center border-r border-slate-200/80 p-3 text-slate-400 dark:border-slate-800/80">
                Time
              </div>

              {weekDays.map((day) => (
                <div
                  key={day.isoDate}
                  className="flex flex-col items-center justify-center gap-1 border-r border-slate-200/80 p-2.5 last:border-r-0 dark:border-slate-800/80"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {day.dayName}
                  </span>

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      day.isToday
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            {/* HOURS */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-slate-100 last:border-b-0 dark:border-slate-800/40"
              >
                <div className="flex items-center justify-center border-r border-slate-200/80 p-2 text-xs font-medium text-slate-400 dark:border-slate-800/80">
                  {`${String(hour).padStart(2, "0")}:00`}
                </div>

                {weekDays.map((day) => {
                  // rawDate's digits are UK time; convert to a real instant to compare against "now".
                  const slotInstant = new Date(
                    ukWallClockToIsoString(
                      day.rawDate.getFullYear(),
                      day.rawDate.getMonth() + 1,
                      day.rawDate.getDate(),
                      hour,
                      0,
                    ),
                  );

                  const isPast = slotInstant < now;
                  const activeAvailability = getActiveAvailability(day, hour);
                  const isAvailable = Boolean(activeAvailability);
                  const isMarkedForRemoval = Boolean(
                    activeAvailability &&
                      selectedForRemoval.has(activeAvailability.id),
                  );

                  let cellStyles =
                    "hover:bg-blue-50/70 dark:hover:bg-blue-950/30";
                  if (isPast) {
                    cellStyles =
                      "cursor-not-allowed bg-slate-50/60 dark:bg-slate-900/30 bg-[repeating-linear-gradient(135deg,rgba(203,213,225,0.4)_0,rgba(203,213,225,0.4)_1px,transparent_0,transparent_10px)] dark:bg-[repeating-linear-gradient(135deg,rgba(51,65,85,0.4)_0,rgba(51,65,85,0.4)_1px,transparent_0,transparent_10px)]";
                  } else if (isMarkedForRemoval) {
                    cellStyles =
                      "bg-red-500/15 font-semibold text-red-700 ring-1 ring-inset ring-red-500/40 dark:bg-red-500/20 dark:text-red-300";
                  } else if (isAvailable) {
                    cellStyles =
                      "bg-blue-500/20 font-semibold text-blue-700 ring-1 ring-inset ring-blue-500/30 dark:bg-blue-500/25 dark:text-blue-300";
                  }

                  let cellContent = null;

                  if (!isPast && !isAvailable) {
                    cellContent = (
                      <span className="hidden items-center justify-center gap-1 text-[10px] text-blue-500 group-hover:flex">
                        <Plus size={12} />
                        Add
                      </span>
                    );
                  } else if (isMarkedForRemoval) {
                    cellContent = (
                      <span className="flex items-center justify-center gap-1 text-[10px] font-semibold">
                        <Trash2 size={12} />
                        Remove
                      </span>
                    );
                  } else if (isAvailable) {
                    cellContent = (
                      <span className="flex items-center justify-center gap-1 text-[10px] font-semibold">
                        <Clock size={12} />
                        Availability Set
                      </span>
                    );
                  }

                  return (
                    <button
                      key={`${day.isoDate}-${hour}`}
                      type="button"
                      disabled={isPast || isRemoving}
                      aria-pressed={isMarkedForRemoval}
                      onClick={() =>
                        handleCellClick(
                          day.fullDayName,
                          hour,
                          day.isoDate,
                          isPast,
                          activeAvailability,
                        )
                      }
                      className={`group relative h-14 border-r border-slate-100 transition-all last:border-r-0 dark:border-slate-800/40 disabled:cursor-not-allowed ${cellStyles}`}
                    >
                      {cellContent}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SET AVAILABILITY MODAL */}
      <SetAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        initialSlot={selectedSlot}
        token={token}
        onSuccess={handleAvailabilitySuccess}
      />
    </div>
  );
};

export default ScheduleCalendarModal;
