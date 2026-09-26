"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Plus,
  Repeat,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { api } from "@utils/api";
import { TimeSlot } from "@utils/actions/availability";
import { toUkDateKey, ukWallClockToIsoString } from "@utils/ukTime";

export interface AvailabilityPayloadItem {
  startTime: string;
  durationInMinutes: number;
}

interface SetAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;

  initialSlot?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    date?: string;
  } | null;

  onSuccess?: (newSlots: TimeSlot[]) => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_PRESETS: { label: string; days: number[] }[] = [
  { label: "Weekdays", days: [0, 1, 2, 3, 4] },
  { label: "Weekends", days: [5, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
];

// A lesson block is 1, 1.5 or 2 hours.
const DURATIONS = [60, 90, 120];
const REPEAT_OPTIONS = [1, 2, 4, 8, 12];
const MAX_SLOTS = 200;
const DAY_MS = 86_400_000;
const MINUTES_IN_DAY = 24 * 60;

type Mode = "specific" | "weekly";

interface GeneratedSlot {
  key: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface Block {
  id: number;
  date: string;
  startTime: string;
  duration: number;
}

interface WeeklyForm {
  days: number[];
  startDate: string;
  from: string;
  to: string;
  lessonLength: number;
  weeks: number;
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toHHMM = (totalMinutes: number): string => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
};

const dayIndexOfDate = (dateStr: string): number => {
  const { year, month, day } = parseDate(dateStr);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
};

const nextDateForDay = (dayName: string): string => {
  const today = toUkDateKey(new Date());
  const distance = (Math.max(0, DAYS.indexOf(dayName)) - dayIndexOfDate(today) + 7) % 7;
  const { year, month, day } = parseDate(today);
  return new Date(Date.UTC(year, month - 1, day) + distance * DAY_MS)
    .toISOString()
    .slice(0, 10);
};

const startsAtMs = (date: string, time: string): number => {
  const { year, month, day } = parseDate(date);
  const minutes = toMinutes(time);
  return new Date(
    ukWallClockToIsoString(year, month, day, Math.floor(minutes / 60), minutes % 60),
  ).getTime();
};

const pickDuration = (minutes: number): number =>
  DURATIONS.includes(minutes) ? minutes : 60;

const durationLabel = (minutes: number) => `${minutes / 60}h`;

const pluralise = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

let nextBlockId = 1;

const buildInitialBlocks = (
  initialSlot?: SetAvailabilityModalProps["initialSlot"],
): Block[] => {
  if (!initialSlot) {
    return [
      { id: nextBlockId++, date: toUkDateKey(new Date()), startTime: "13:00", duration: 60 },
    ];
  }

  return [
    {
      id: nextBlockId++,
      date: initialSlot.date || nextDateForDay(initialSlot.dayOfWeek),
      startTime: initialSlot.startTime,
      duration: pickDuration(toMinutes(initialSlot.endTime) - toMinutes(initialSlot.startTime)),
    },
  ];
};

const buildInitialWeekly = (
  initialSlot?: SetAvailabilityModalProps["initialSlot"],
): WeeklyForm => {
  const today = toUkDateKey(new Date());

  if (!initialSlot) {
    return { days: [0], startDate: today, from: "09:00", to: "12:00", lessonLength: 60, weeks: 1 };
  }

  const date = initialSlot.date || nextDateForDay(initialSlot.dayOfWeek);

  return {
    days: [dayIndexOfDate(date)],
    startDate: date,
    from: initialSlot.startTime,
    to: initialSlot.endTime,
    lessonLength: pickDuration(toMinutes(initialSlot.endTime) - toMinutes(initialSlot.startTime)),
    weeks: 1,
  };
};

const generateWeeklySlots = (form: WeeklyForm): GeneratedSlot[] => {
  const fromMinutes = toMinutes(form.from || "00:00");
  const toMinutesValue = toMinutes(form.to || "00:00");
  if (!form.startDate || !form.from || !form.to || toMinutesValue <= fromMinutes) {
    return [];
  }

  const { year, month, day } = parseDate(form.startDate);
  const startMs = Date.UTC(year, month - 1, day);
  const mondayMs = startMs - dayIndexOfDate(form.startDate) * DAY_MS;
  const now = Date.now();

  const slots: GeneratedSlot[] = [];

  for (let week = 0; week < form.weeks; week++) {
    for (const dayIndex of [...form.days].sort((a, b) => a - b)) {
      const dateMs = mondayMs + (week * 7 + dayIndex) * DAY_MS;
      if (dateMs < startMs) continue;

      const date = new Date(dateMs).toISOString().slice(0, 10);

      for (
        let start = fromMinutes;
        start + form.lessonLength <= toMinutesValue;
        start += form.lessonLength
      ) {
        // Skip anything that has already started (UK wall-clock time).
        if (startsAtMs(date, toHHMM(start)) <= now) continue;

        slots.push({
          key: `${date}|${toHHMM(start)}`,
          date,
          dayOfWeek: DAYS[dayIndex],
          startTime: toHHMM(start),
          endTime: toHHMM(start + form.lessonLength),
        });
      }
    }
  }

  return slots;
};

const blockToSlot = (block: Block): GeneratedSlot => ({
  key: `${block.date}|${block.startTime}`,
  date: block.date,
  dayOfWeek: DAYS[dayIndexOfDate(block.date)],
  startTime: block.startTime,
  endTime: toHHMM(toMinutes(block.startTime) + block.duration),
});

const getBlockErrors = (blocks: Block[]): Record<number, string> => {
  const errors: Record<number, string> = {};
  const now = Date.now();

  for (const block of blocks) {
    if (!block.date || !block.startTime) {
      errors[block.id] = "Pick a date and start time.";
    } else if (toMinutes(block.startTime) + block.duration > MINUTES_IN_DAY) {
      errors[block.id] = "This block must finish by midnight.";
    } else if (startsAtMs(block.date, block.startTime) <= now) {
      errors[block.id] = "This time has already passed.";
    }
  }

  for (const block of blocks) {
    if (errors[block.id]) continue;

    const start = toMinutes(block.startTime);
    const end = start + block.duration;
    const clash = blocks.some(
      (other) =>
        other.id !== block.id &&
        !errors[other.id] &&
        other.date === block.date &&
        toMinutes(other.startTime) < end &&
        toMinutes(other.startTime) + other.duration > start,
    );

    if (clash) errors[block.id] = "Overlaps another block on this day.";
  }

  return errors;
};

const formatDateHeading = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const chipClass = (active: boolean) =>
  `cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? "border-blue-600 bg-blue-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;

const tabClass = (active: boolean) =>
  `flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
    active
      ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
  }`;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";

const labelClass =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400";

const SetAvailabilityModal = ({
  isOpen,
  onClose,
  token,
  initialSlot,
  onSuccess,
}: SetAvailabilityModalProps) => {
  const [isPending, startTransition] = useTransition();

  const [prevInitialSlot, setPrevInitialSlot] = useState(initialSlot);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const [mode, setMode] = useState<Mode>("specific");
  const [blocks, setBlocks] = useState<Block[]>(() => buildInitialBlocks(initialSlot));
  const [weekly, setWeekly] = useState<WeeklyForm>(() => buildInitialWeekly(initialSlot));
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (isOpen !== prevIsOpen || initialSlot !== prevInitialSlot) {
    setPrevIsOpen(isOpen);
    setPrevInitialSlot(initialSlot);
    setError(null);

    if (isOpen) {
      setMode("specific");
      setBlocks(buildInitialBlocks(initialSlot));
      setWeekly(buildInitialWeekly(initialSlot));
      setRemovedKeys(new Set());
    }
  }

  const blockErrors = useMemo(() => getBlockErrors(blocks), [blocks]);

  const weeklySlots = useMemo(
    () => generateWeeklySlots(weekly).filter((slot) => !removedKeys.has(slot.key)),
    [weekly, removedKeys],
  );

  const slots = useMemo(
    () => (mode === "specific" ? blocks.map(blockToSlot) : weeklySlots),
    [mode, blocks, weeklySlots],
  );

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, GeneratedSlot[]>();
    for (const slot of weeklySlots) {
      groups.set(slot.date, [...(groups.get(slot.date) ?? []), slot]);
    }
    return [...groups.entries()];
  }, [weeklySlots]);

  if (!isOpen) return null;

  const updateWeekly = (patch: Partial<WeeklyForm>) =>
    setWeekly((previous) => ({ ...previous, ...patch }));

  const toggleDay = (dayIndex: number) =>
    updateWeekly({
      days: weekly.days.includes(dayIndex)
        ? weekly.days.filter((day) => day !== dayIndex)
        : [...weekly.days, dayIndex],
    });

  const updateBlock = (id: number, patch: Partial<Block>) =>
    setBlocks((previous) =>
      previous.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );

  const removeBlock = (id: number) =>
    setBlocks((previous) => previous.filter((block) => block.id !== id));

  // New blocks continue straight on from the last one (same day, next hour).
  const addBlock = () =>
    setBlocks((previous) => {
      const last = previous[previous.length - 1];
      if (!last) {
        return [{ id: nextBlockId++, date: toUkDateKey(new Date()), startTime: "13:00", duration: 60 }];
      }

      const nextStart = toMinutes(last.startTime) + last.duration;
      const fits = nextStart + last.duration <= MINUTES_IN_DAY;

      return [
        ...previous,
        {
          id: nextBlockId++,
          date: last.date,
          startTime: fits ? toHHMM(nextStart) : last.startTime,
          duration: last.duration,
        },
      ];
    });

  const removeWeeklySlot = (key: string) =>
    setRemovedKeys((previous) => new Set(previous).add(key));

  const timeWindowInvalid =
    !!weekly.from && !!weekly.to && toMinutes(weekly.to) <= toMinutes(weekly.from);
  const tooMany = slots.length > MAX_SLOTS;

  const validationMessage = (() => {
    if (mode === "specific") {
      if (blocks.length === 0) return "Add at least one block.";
      if (Object.keys(blockErrors).length > 0) return "Fix the highlighted blocks first.";
      return null;
    }

    if (weekly.days.length === 0) return "Pick at least one day.";
    if (timeWindowInvalid) return "End time must be after start time.";
    if (weeklySlots.length === 0) {
      return weekly.to && toMinutes(weekly.to) - toMinutes(weekly.from) < weekly.lessonLength
        ? "Your time window is shorter than one lesson."
        : "No upcoming slots match these settings.";
    }
    if (tooMany) return `That's ${slots.length} slots — please keep it to ${MAX_SLOTS} or fewer.`;
    return null;
  })();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    startTransition(async () => {
      try {
        const results = await Promise.allSettled(
          slots.map((slot) => {
            const { year, month, day } = parseDate(slot.date);
            const [hours, minutes] = slot.startTime.split(":").map(Number);

            // Pickers are always UK wall-clock time, not the device's timezone.
            return api.availability.create(
              {
                startTime: ukWallClockToIsoString(year, month, day, hours, minutes),
                durationInMinutes: toMinutes(slot.endTime) - toMinutes(slot.startTime),
              },
              token,
            );
          }),
        );

        const created: TimeSlot[] = [];
        const savedKeys = new Set<string>();
        let failed = 0;
        let firstFailure = "";

        results.forEach((result, index) => {
          const slot = slots[index];

          if (result.status === "fulfilled" && result.value.data) {
            created.push({
              // The server-assigned id — needed to delete this slot later.
              id: result.value.data.id,
              date: slot.date,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
            savedKeys.add(slot.key);
            return;
          }

          failed++;
          if (!firstFailure) {
            console.error(
              "Availability submission error:",
              result.status === "rejected" ? result.reason : result.value,
            );
            firstFailure =
              result.status === "rejected" && result.reason instanceof Error
                ? result.reason.message
                : "Server did not return the created slot.";
          }
        });

        if (created.length > 0) onSuccess?.(created);

        if (failed === 0) {
          onClose();
          return;
        }

        // Keep the modal open with only the slots that failed so they can be retried.
        if (mode === "specific") {
          setBlocks((previous) =>
            previous.filter((block) => !savedKeys.has(blockToSlot(block).key)),
          );
        } else {
          setRemovedKeys((previous) => new Set([...previous, ...savedKeys]));
        }

        setError(
          `${created.length} saved, ${failed} failed: ${firstFailure}. The failed slots are still listed so you can try again.`,
        );
      } catch (err: unknown) {
        console.error("Availability submission error:", err);
        setError(err instanceof Error ? err.message : "Failed to save availability.");
      }
    });
  };

  const saveLabel =
    slots.length > 0 ? `Save ${pluralise(slots.length, "slot")}` : "Save availability";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Add Availability
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set the blocks of time students can book with you.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => setMode("specific")}
                className={tabClass(mode === "specific")}
              >
                <CalendarDays size={14} /> Specific dates
              </button>
              <button
                type="button"
                onClick={() => setMode("weekly")}
                className={tabClass(mode === "weekly")}
              >
                <Repeat size={14} /> Repeat weekly
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {mode === "specific" ? (
              <section className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Each block is its own bookable lesson — add as many as you like, including
                  several on the same day.
                </p>

                {blocks.map((block, index) => {
                  const blockError = blockErrors[block.id];
                  const endLabel =
                    block.startTime && toMinutes(block.startTime) + block.duration <= MINUTES_IN_DAY
                      ? toHHMM(toMinutes(block.startTime) + block.duration)
                      : null;

                  return (
                    <div
                      key={block.id}
                      className={`rounded-xl border p-3 ${
                        blockError
                          ? "border-red-300 bg-red-50/40 dark:border-red-900 dark:bg-red-950/10"
                          : "border-slate-200/80 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Block {index + 1}
                          {block.date && ` · ${formatDateHeading(block.date)}`}
                          {endLabel && ` · ${block.startTime}–${endLabel}`}
                        </span>
                        {blocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            aria-label={`Remove block ${index + 1}`}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Date</label>
                          <input
                            type="date"
                            value={block.date}
                            onChange={(event) => updateBlock(block.id, { date: event.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Start time</label>
                          <div className="relative">
                            <Clock
                              size={13}
                              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="time"
                              step={900}
                              value={block.startTime}
                              onChange={(event) =>
                                updateBlock(block.id, { startTime: event.target.value })
                              }
                              className={`${inputClass} pl-8`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className={labelClass}>Length</span>
                        <div className="flex flex-wrap gap-2">
                          {DURATIONS.map((duration) => (
                            <button
                              key={duration}
                              type="button"
                              aria-pressed={block.duration === duration}
                              onClick={() => updateBlock(block.id, { duration })}
                              className={chipClass(block.duration === duration)}
                            >
                              {durationLabel(duration)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {blockError && (
                        <p className="mt-2 text-[11px] font-medium text-red-500">{blockError}</p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addBlock}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50"
                >
                  <Plus size={14} />
                  Add another block
                </button>
              </section>
            ) : (
              <>
                <section>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      1 · Which days?
                    </span>
                    <div className="flex gap-3">
                      {DAY_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => updateWeekly({ days: preset.days })}
                          className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={weekly.days.includes(index)}
                        onClick={() => toggleDay(index)}
                        className={chipClass(weekly.days.includes(index))}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <span className={labelClass}>2 · What hours?</span>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Clock
                        size={13}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="time"
                        step={900}
                        value={weekly.from}
                        onChange={(event) => updateWeekly({ from: event.target.value })}
                        aria-label="From"
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      step={900}
                      value={weekly.to}
                      onChange={(event) => updateWeekly({ to: event.target.value })}
                      aria-label="To"
                      className={`${inputClass} flex-1`}
                    />
                  </div>
                  {timeWindowInvalid && (
                    <p className="mt-1.5 text-[11px] font-medium text-red-500">
                      End time must be after start time.
                    </p>
                  )}
                </section>

                <section>
                  <span className={labelClass}>3 · Lesson length</span>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((length) => (
                      <button
                        key={length}
                        type="button"
                        aria-pressed={weekly.lessonLength === length}
                        onClick={() => updateWeekly({ lessonLength: length })}
                        className={chipClass(weekly.lessonLength === length)}
                      >
                        {durationLabel(length)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Your hours are split into back-to-back lessons of this length.
                  </p>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="availability-start-date">
                      4 · Starting from
                    </label>
                    <input
                      id="availability-start-date"
                      type="date"
                      value={weekly.startDate}
                      onChange={(event) => updateWeekly({ startDate: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <span className={labelClass}>Repeat for</span>
                    <div className="flex flex-wrap gap-2">
                      {REPEAT_OPTIONS.map((weeks) => (
                        <button
                          key={weeks}
                          type="button"
                          aria-pressed={weekly.weeks === weeks}
                          onClick={() => updateWeekly({ weeks })}
                          className={chipClass(weekly.weeks === weeks)}
                        >
                          {weeks === 1 ? "Once" : `${weeks} wks`}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {weeklySlots.length === 0
                        ? "Preview"
                        : `${pluralise(weeklySlots.length, "slot")} across ${pluralise(groupedSlots.length, "day")}`}
                    </h3>
                    {removedKeys.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setRemovedKeys(new Set())}
                        className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        <RotateCcw size={11} /> Restore removed
                      </button>
                    )}
                  </div>

                  {weeklySlots.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      {validationMessage ?? "Slots you create will appear here."}
                    </p>
                  ) : (
                    <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                      {groupedSlots.map(([date, daySlots]) => (
                        <div key={date}>
                          <p className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {formatDateHeading(date)}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {daySlots.map((slot) => (
                              <span
                                key={slot.key}
                                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                              >
                                {slot.startTime}–{slot.endTime}
                                <button
                                  type="button"
                                  onClick={() => removeWeeklySlot(slot.key)}
                                  aria-label={`Remove ${formatDateHeading(date)} ${slot.startTime}`}
                                  className="cursor-pointer rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900"
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <p className="text-[11px] text-slate-400">All times are UK time.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending || slots.length === 0 || tooMany || !!validationMessage}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarPlus size={14} />
                {isPending ? "Saving..." : saveLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetAvailabilityModal;
