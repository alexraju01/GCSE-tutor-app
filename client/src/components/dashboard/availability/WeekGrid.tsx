"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import type { OwnAvailabilitySlot } from "@utils/api";
import { cn } from "@utils/cn";
import {
  addDaysToKey,
  formatDayKey,
  minutesToHHMM,
  toUkDateKey,
  ukInstant,
  ukMinutesOfDay,
} from "@utils/ukTime";

// full day in 30 min rows, scrolled to the afternoon on load
const ROW_MINUTES = 30;
const ROW_HEIGHT = 22; // px
const ROWS = (24 * 60) / ROW_MINUTES;
const INITIAL_SCROLL_MINUTES = 14 * 60;

export interface CreateRange {
  date: string;
  fromMinutes: number;
  toMinutes: number;
}

interface WeekGridProps {
  weekStartKey: string;
  slots: OwnAvailabilitySlot[];
  now: Date;
  onSlotClick: (slot: OwnAvailabilitySlot) => void;
  onCreateRange: (range: CreateRange) => void;
}

interface DragState {
  date: string;
  anchor: number; // minutes
  current: number;
}

const slotMinutes = (slot: OwnAvailabilitySlot) =>
  Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60_000);

const slotTone = (slot: OwnAvailabilitySlot, isPast: boolean) => {
  if (isPast) {
    // faded so it reads as history on top of the stripes
    return "border-dashed border-slate-300 bg-white/70 text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500";
  }
  switch (slot.lesson?.status) {
    case "Pending":
      return "border-amber-400/60 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200";
    case "Upcoming":
    case "Confirmed":
      return "border-violet-400/60 bg-violet-100 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200";
    default:
      return "border-blue-400/60 bg-blue-100 text-blue-800 hover:bg-blue-200/80 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/30";
  }
};

const slotLabel = (slot: OwnAvailabilitySlot) => {
  if (!slot.lesson) return "Open";
  const name = slot.lesson.studentName ?? "Student";
  return slot.lesson.status === "Pending" ? `Request · ${name}` : name;
};

// faded diagonal lines over time that's already gone
const PAST_STRIPES =
  "repeating-linear-gradient(135deg, rgb(148 163 184 / 0.22) 0 1px, transparent 1px 9px)";

const snap = (minutes: number) =>
  Math.max(0, Math.min(ROWS - 1, Math.floor(minutes / ROW_MINUTES))) * ROW_MINUTES;

// drags start on any half hour but always cover whole hours (min 1h), so
// the default 1h lessons fill the box exactly - no 30 min leftovers
const DRAG_STEP_MINUTES = 60;
const DAY_MINUTES = 24 * 60;

const rangeFromDrag = (anchor: number, current: number) => {
  const start = Math.min(anchor, current);
  const span = Math.max(anchor, current) + ROW_MINUTES - start;
  const length = Math.max(DRAG_STEP_MINUTES, Math.ceil(span / DRAG_STEP_MINUTES) * DRAG_STEP_MINUTES);
  const to = Math.min(start + length, DAY_MINUTES);
  // keep at least one whole lesson if we hit midnight
  const from = Math.min(start, to - DRAG_STEP_MINUTES);
  return { from, to };
};

const WeekGrid = ({ weekStartKey, slots, now, onSlotClick, onCreateRange }: WeekGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (INITIAL_SCROLL_MINUTES / ROW_MINUTES) * ROW_HEIGHT;
    }
  }, []);

  const todayKey = toUkDateKey(now);
  const nowMinutes = ukMinutesOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));

  const slotsByDay = new Map<string, OwnAvailabilitySlot[]>();
  for (const slot of slots) {
    const key = toUkDateKey(new Date(slot.startTime));
    slotsByDay.set(key, [...(slotsByDay.get(key) ?? []), slot]);
  }

  const minutesFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return snap(((event.clientY - rect.top) / ROW_HEIGHT) * ROW_MINUTES);
  };

  const handlePointerDown = (date: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
    // only start a drag on empty space, not on an existing slot
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const minutes = minutesFromPointer(event);
    setDrag({ date, anchor: minutes, current: minutes });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const minutes = minutesFromPointer(event);
    if (minutes !== drag.current) setDrag({ ...drag, current: minutes });
  };

  const handlePointerUp = () => {
    if (!drag) return;
    const { from, to } = rangeFromDrag(drag.anchor, drag.current);
    const range = { date: drag.date, fromMinutes: from, toMinutes: to };
    setDrag(null);
    // wait for this gesture's click to finish, otherwise the dialog sees it as
    // a click outside and closes straight away
    window.setTimeout(() => onCreateRange(range), 0);
  };

  const dragRange = drag && rangeFromDrag(drag.anchor, drag.current);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <div className="min-w-190">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200/80 bg-slate-50 text-center dark:border-slate-800/80 dark:bg-slate-800/40">
            <div className="border-r border-slate-200/80 p-2 text-[10px] font-semibold uppercase text-slate-400 dark:border-slate-800/80">
              UK
            </div>
            {days.map((day) => {
              const isToday = day === todayKey;
              const dayCount = slotsByDay.get(day)?.length ?? 0;
              return (
                <div
                  key={day}
                  className="flex flex-col items-center gap-0.5 border-r border-slate-200/80 p-2 last:border-r-0 dark:border-slate-800/80"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {formatDayKey(day, { weekday: "short" })}
                  </span>
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-800 dark:text-slate-100",
                    )}
                  >
                    {formatDayKey(day, { day: "numeric" })}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {dayCount > 0 ? `${dayCount} slot${dayCount === 1 ? "" : "s"}` : " "}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scrollable day body */}
          <div ref={scrollRef} className="max-h-140 overflow-y-auto">
            <div className="grid grid-cols-[56px_repeat(7,1fr)]">
              {/* Time gutter */}
              <div className="relative border-r border-slate-200/80 dark:border-slate-800/80" style={{ height: ROWS * ROW_HEIGHT }}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <span
                    key={hour}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-slate-400"
                    style={{ top: hour * 2 * ROW_HEIGHT }}
                  >
                    {hour === 0 ? "" : minutesToHHMM(hour * 60)}
                  </span>
                ))}
              </div>

              {days.map((day) => {
                const isPastDay = day < todayKey;
                let pastMinutes = 0;
                if (isPastDay) pastMinutes = 24 * 60;
                else if (day === todayKey) pastMinutes = nowMinutes;

                return (
                  <div
                    key={day}
                    role="presentation"
                    onPointerDown={handlePointerDown(day)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={() => setDrag(null)}
                    className="relative cursor-crosshair touch-none select-none border-r border-slate-100 last:border-r-0 dark:border-slate-800/60"
                    style={{
                      height: ROWS * ROW_HEIGHT,
                      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW_HEIGHT * 2 - 1}px, rgb(148 163 184 / 0.25) ${ROW_HEIGHT * 2 - 1}px, rgb(148 163 184 / 0.25) ${ROW_HEIGHT * 2}px)`,
                    }}
                  >
                    {/* Past shading */}
                    {pastMinutes > 0 && (
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 bg-slate-50/80 dark:bg-slate-950/50"
                        style={{
                          height: (pastMinutes / ROW_MINUTES) * ROW_HEIGHT,
                          backgroundImage: PAST_STRIPES,
                        }}
                      />
                    )}

                    {/* Now line */}
                    {day === todayKey && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                        style={{ top: (nowMinutes / ROW_MINUTES) * ROW_HEIGHT }}
                      />
                    )}

                    {(slotsByDay.get(day) ?? []).map((slot) => {
                      const start = new Date(slot.startTime);
                      const minutes = slotMinutes(slot);
                      const top = (ukMinutesOfDay(start) / ROW_MINUTES) * ROW_HEIGHT;
                      const height = Math.max((minutes / ROW_MINUTES) * ROW_HEIGHT - 2, 18);
                      const isPast = new Date(slot.endTime) <= now;
                      const timeLabel = `${minutesToHHMM(ukMinutesOfDay(start))}–${minutesToHHMM(
                        ukMinutesOfDay(new Date(slot.endTime)),
                      )}`;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => onSlotClick(slot)}
                          aria-label={`${formatDayKey(day, { weekday: "long", day: "numeric", month: "long" })}, ${timeLabel}: ${slotLabel(slot)}`}
                          className={cn(
                            "absolute inset-x-1 z-20 cursor-pointer overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[10px] leading-tight shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-600",
                            slotTone(slot, isPast),
                          )}
                          style={{ top: top + 1, height }}
                        >
                          <span className="block font-semibold">{timeLabel}</span>
                          {height > 30 && <span className="block truncate">{slotLabel(slot)}</span>}
                        </button>
                      );
                    })}

                    {/* Drag ghost */}
                    {drag && dragRange && drag.date === day && (
                      <div
                        className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-dashed border-blue-500 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300"
                        style={{
                          top: (dragRange.from / ROW_MINUTES) * ROW_HEIGHT,
                          height: ((dragRange.to - dragRange.from) / ROW_MINUTES) * ROW_HEIGHT,
                        }}
                      >
                        {minutesToHHMM(dragRange.from)}–{minutesToHHMM(dragRange.to)}
                        <span className="block font-medium">
                          {(dragRange.to - dragRange.from) / 60} × 1h lesson{dragRange.to - dragRange.from > 60 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekGrid;

// start/end of the visible week
export const weekRange = (weekStartKey: string) => ({
  from: ukInstant(weekStartKey),
  to: ukInstant(addDaysToKey(weekStartKey, 7)),
});
