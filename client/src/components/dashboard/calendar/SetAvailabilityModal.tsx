"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarDays, CalendarPlus, Clock, Plus, Repeat, RotateCcw, Trash2, X } from "lucide-react";

import { Modal } from "@components/ui/modal";
import { isAllowedLessonDuration, LESSON_DURATIONS } from "@constants/index";
import {
  createAvailabilityAction,
  createRecurringAvailabilityAction,
  getMyAvailabilityAction,
} from "@utils/actions/availability";
import {
  addDaysToKey,
  dayIndexOfKey,
  formatDayKey,
  getUkDateParts,
  hhmmToMinutes,
  minutesToHHMM,
  toUkDateKey,
  ukInstant,
} from "@utils/ukTime";

// prefill from dragging on the week grid
export interface AvailabilityDraft {
  date: string; // UK "YYYY-MM-DD"
  from: string; // "HH:mm"
  to: string; // "HH:mm"
}

interface SetAvailabilityModalProps {
  open: boolean;
  onClose: () => void;
  draft?: AvailabilityDraft | null;
  onSaved: (result: { created: number; skipped: number }) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_PRESETS: { label: string; days: number[] }[] = [
  { label: "Weekdays", days: [0, 1, 2, 3, 4] },
  { label: "Weekends", days: [5, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
];

// keep in sync with availability.schema.ts on the server
const REPEAT_OPTIONS = [1, 2, 4, 8, 12];
const MAX_SLOTS = 200;
const MAX_BLOCKS = 50;
const MINUTES_IN_DAY = 24 * 60;

type Mode = "window" | "slots";

interface Range {
  start: number; // epoch ms
  end: number;
}

interface GeneratedSlot {
  key: string; // "YYYY-MM-DD|HH:mm" — matches the server's exclude format
  date: string;
  startTime: string;
  endTime: string;
  range: Range;
}

interface Block {
  id: number;
  date: string;
  startTime: string;
  duration: number;
}

interface WindowForm {
  days: number[];
  startDate: string;
  from: string;
  to: string;
  lessonLength: number;
  weeks: number;
}

const rangeOf = (date: string, startTime: string, minutes: number): Range => {
  const start = ukInstant(date, hhmmToMinutes(startTime)).getTime();
  return { start, end: start + minutes * 60_000 };
};

const overlaps = (a: Range, b: Range) => a.start < b.end && b.start < a.end;

const pickDuration = (minutes: number) => (isAllowedLessonDuration(minutes) ? minutes : 60);
const durationLabel = (minutes: number) => `${minutes / 60}h`;
const pluralise = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const dateHeading = (date: string) =>
  formatDayKey(date, { weekday: "long", day: "numeric", month: "short" });

// next full hour at least an hour away, or tomorrow 16:00 if it's getting late
const nextSensibleStart = (): { date: string; time: string } => {
  const now = new Date();
  const { hour, minute } = getUkDateParts(now);
  const nextHour = hour + (minute > 0 ? 2 : 1);
  if (nextHour <= 20) return { date: toUkDateKey(now), time: minutesToHHMM(nextHour * 60) };
  return { date: addDaysToKey(toUkDateKey(now), 1), time: "16:00" };
};

let nextBlockId = 1;

const buildInitialBlocks = (draft?: AvailabilityDraft | null): Block[] => {
  if (draft) {
    return [
      {
        id: nextBlockId++,
        date: draft.date,
        startTime: draft.from,
        duration: pickDuration(hhmmToMinutes(draft.to) - hhmmToMinutes(draft.from)),
      },
    ];
  }
  const { date, time } = nextSensibleStart();
  return [{ id: nextBlockId++, date, startTime: time, duration: 60 }];
};

const buildInitialWindow = (draft?: AvailabilityDraft | null): WindowForm => {
  if (draft) {
    return {
      days: [dayIndexOfKey(draft.date)],
      startDate: draft.date,
      from: draft.from,
      to: draft.to,
      lessonLength: 60,
      weeks: 1,
    };
  }
  const { date } = nextSensibleStart();
  return { days: [dayIndexOfKey(date)], startDate: date, from: "16:00", to: "19:00", lessonLength: 60, weeks: 1 };
};

const generateWindowSlots = (form: WindowForm): GeneratedSlot[] => {
  const fromMinutes = hhmmToMinutes(form.from || "00:00");
  const toMinutesValue = hhmmToMinutes(form.to || "00:00");
  if (!form.startDate || !form.from || !form.to || toMinutesValue <= fromMinutes) return [];

  const monday = addDaysToKey(form.startDate, -dayIndexOfKey(form.startDate));
  const now = Date.now();
  const slots: GeneratedSlot[] = [];

  for (let week = 0; week < form.weeks; week++) {
    for (const dayIndex of [...form.days].sort((a, b) => a - b)) {
      const date = addDaysToKey(monday, week * 7 + dayIndex);
      if (date < form.startDate) continue;

      for (let start = fromMinutes; start + form.lessonLength <= toMinutesValue; start += form.lessonLength) {
        const startTime = minutesToHHMM(start);
        const range = rangeOf(date, startTime, form.lessonLength);
        // skip anything that's already started
        if (range.start <= now) continue;

        slots.push({
          key: `${date}|${startTime}`,
          date,
          startTime,
          endTime: minutesToHHMM(start + form.lessonLength),
          range,
        });
      }
    }
  }

  return slots;
};

const getBlockErrors = (blocks: Block[], existing: Range[]): Record<number, string> => {
  const errors: Record<number, string> = {};
  const now = Date.now();

  for (const block of blocks) {
    if (!block.date || !block.startTime) {
      errors[block.id] = "Pick a date and start time.";
    } else if (hhmmToMinutes(block.startTime) + block.duration > MINUTES_IN_DAY) {
      errors[block.id] = "This slot must finish by midnight.";
    } else if (rangeOf(block.date, block.startTime, block.duration).start <= now) {
      errors[block.id] = "This time has already passed.";
    } else if (existing.some((r) => overlaps(r, rangeOf(block.date, block.startTime, block.duration)))) {
      errors[block.id] = "You already have availability at this time.";
    }
  }

  for (const block of blocks) {
    if (errors[block.id]) continue;
    const range = rangeOf(block.date, block.startTime, block.duration);
    const clash = blocks.some(
      (other) =>
        other.id !== block.id &&
        !errors[other.id] &&
        overlaps(range, rangeOf(other.date, other.startTime, other.duration)),
    );
    if (clash) errors[block.id] = "Overlaps another slot in this list.";
  }

  return errors;
};

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

const labelClass = "mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400";

const SetAvailabilityModal = ({ open, onClose, draft, onSaved }: SetAvailabilityModalProps) => {
  const [isPending, startTransition] = useTransition();

  const [prevOpen, setPrevOpen] = useState(open);
  const [mode, setMode] = useState<Mode>("window");
  const [blocks, setBlocks] = useState<Block[]>(() => buildInitialBlocks(draft));
  const [windowForm, setWindowForm] = useState<WindowForm>(() => buildInitialWindow(draft));
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const [existing, setExisting] = useState<Range[]>([]);
  const [error, setError] = useState<string | null>(null);

  // reset the form each time it opens
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode("window");
      setBlocks(buildInitialBlocks(draft));
      setWindowForm(buildInitialWindow(draft));
      setRemovedKeys(new Set());
      setError(null);
    }
  }

  // date range the form covers - used to load existing slots so clashes show in the preview
  const span = useMemo(() => {
    if (mode === "window") {
      if (!windowForm.startDate) return null;
      return { from: windowForm.startDate, to: addDaysToKey(windowForm.startDate, windowForm.weeks * 7) };
    }
    const dates = blocks.map((b) => b.date).filter(Boolean).sort();
    if (dates.length === 0) return null;
    return { from: dates[0], to: addDaysToKey(dates[dates.length - 1], 1) };
  }, [mode, windowForm.startDate, windowForm.weeks, blocks]);

  const spanKey = span ? `${span.from}|${span.to}` : "";

  useEffect(() => {
    if (!open || !span) return;
    let ignore = false;

    void getMyAvailabilityAction(ukInstant(span.from).toISOString(), ukInstant(span.to).toISOString()).then(
      (result) => {
        if (ignore || !result.ok) return;
        setExisting(
          result.data.map((slot) => ({
            start: new Date(slot.startTime).getTime(),
            end: new Date(slot.endTime).getTime(),
          })),
        );
      },
    );

    return () => {
      ignore = true;
    };
    // spanKey instead of span, span is a new object every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spanKey]);

  const blockErrors = useMemo(() => getBlockErrors(blocks, existing), [blocks, existing]);

  const generated = useMemo(
    () => generateWindowSlots(windowForm).filter((slot) => !removedKeys.has(slot.key)),
    [windowForm, removedKeys],
  );

  const isClash = (slot: GeneratedSlot) => existing.some((r) => overlaps(r, slot.range));
  const windowSlots = generated.filter((slot) => !isClash(slot));
  const clashCount = generated.length - windowSlots.length;

  const groupedGenerated = useMemo(() => {
    const groups = new Map<string, GeneratedSlot[]>();
    for (const slot of generated) groups.set(slot.date, [...(groups.get(slot.date) ?? []), slot]);
    return [...groups.entries()];
  }, [generated]);

  const slotCount = mode === "slots" ? blocks.length : windowSlots.length;

  const updateWindow = (patch: Partial<WindowForm>) => setWindowForm((previous) => ({ ...previous, ...patch }));

  const toggleDay = (dayIndex: number) =>
    updateWindow({
      days: windowForm.days.includes(dayIndex)
        ? windowForm.days.filter((day) => day !== dayIndex)
        : [...windowForm.days, dayIndex],
    });

  const updateBlock = (id: number, patch: Partial<Block>) =>
    setBlocks((previous) => previous.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  const removeBlock = (id: number) => setBlocks((previous) => previous.filter((block) => block.id !== id));

  // new slot starts where the last one ended
  const addBlock = () =>
    setBlocks((previous) => {
      const last = previous[previous.length - 1];
      if (!last) return buildInitialBlocks();

      const nextStart = hhmmToMinutes(last.startTime) + last.duration;
      const fits = nextStart + last.duration <= MINUTES_IN_DAY;
      return [
        ...previous,
        {
          id: nextBlockId++,
          date: fits ? last.date : addDaysToKey(last.date, 1),
          startTime: fits ? minutesToHHMM(nextStart) : last.startTime,
          duration: last.duration,
        },
      ];
    });

  // time at the end of the window that doesn't fit a whole lesson
  const windowMinutes = hhmmToMinutes(windowForm.to || "00:00") - hhmmToMinutes(windowForm.from || "00:00");
  const leftoverMinutes =
    windowMinutes >= windowForm.lessonLength ? windowMinutes % windowForm.lessonLength : 0;

  const timeWindowInvalid =
    !!windowForm.from && !!windowForm.to && hhmmToMinutes(windowForm.to) <= hhmmToMinutes(windowForm.from);

  const validationMessage = (() => {
    if (mode === "slots") {
      if (blocks.length === 0) return "Add at least one slot.";
      if (Object.keys(blockErrors).length > 0) return "Fix the highlighted slots first.";
      if (blocks.length > MAX_BLOCKS) return `Please keep it to ${MAX_BLOCKS} slots or fewer.`;
      return null;
    }

    if (windowForm.days.length === 0) return "Pick at least one day.";
    if (timeWindowInvalid) return "End time must be after start time.";
    if (generated.length === 0) {
      return hhmmToMinutes(windowForm.to) - hhmmToMinutes(windowForm.from) < windowForm.lessonLength
        ? "Your time window is shorter than one lesson."
        : "No upcoming slots match these settings.";
    }
    if (windowSlots.length === 0) return "You already have availability at all of these times.";
    if (windowSlots.length > MAX_SLOTS) {
      return `That's ${windowSlots.length} slots — please keep it to ${MAX_SLOTS} or fewer.`;
    }
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
      if (mode === "window") {
        // exclude known clashes so "skipped" only covers new ones
        const result = await createRecurringAvailabilityAction({
          ...windowForm,
          exclude: [...removedKeys, ...generated.filter(isClash).map((slot) => slot.key)],
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved({ created: result.data.created.length, skipped: result.data.skipped.length });
      } else {
        const result = await createAvailabilityAction(
          blocks.map((block) => ({
            // pickers are UK time, not the device's timezone
            startTime: ukInstant(block.date, hhmmToMinutes(block.startTime)).toISOString(),
            durationInMinutes: block.duration,
          })),
        );
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved({ created: result.data.length, skipped: 0 });
      }
      onClose();
    });
  };

  const saveLabel = slotCount > 0 ? `Save ${pluralise(slotCount, "slot")}` : "Save availability";

  const footer = (
    <div className="flex items-center justify-between gap-3 ">
      <p className="text-[11px] text-slate-400">All times are UK time.</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
              form="set-availability-form"
          disabled={isPending || slotCount === 0 || !!validationMessage}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus size={14} />
          {isPending ? "Saving..." : saveLabel}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isPending}
      size="max-w-2xl"
      title="Add availability"
      description="Set the times students can book with you. All times are UK time."
      bodyClassName="p-0"
      footer={footer}
    >
      <form id="set-availability-form" onSubmit={handleSubmit}>
        <div className="space-y-5 px-6 py-5">
          <div role="tablist" className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "window"}
              onClick={() => setMode("window")}
              className={tabClass(mode === "window")}
            >
              <Repeat size={14} /> Block of hours
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "slots"}
              onClick={() => setMode("slots")}
              className={tabClass(mode === "slots")}
            >
              <CalendarDays size={14} /> Individual slots
            </button>
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {draft && (
            <p className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <CalendarDays size={13} />
              From your selection: <strong>{dateHeading(draft.date)}, {draft.from}–{draft.to}</strong>
            </p>
          )}

          {mode === "slots" ? (
            <section className="space-y-3">
              <p className="text-[11px] text-slate-400">
                Each slot is one bookable lesson — add as many as you like, including several on the same day.
              </p>

              {blocks.map((block, index) => {
                const blockError = blockErrors[block.id];
                const endMinutes = hhmmToMinutes(block.startTime || "00:00") + block.duration;
                const endLabel = block.startTime && endMinutes <= MINUTES_IN_DAY ? minutesToHHMM(endMinutes) : null;

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
                        Slot {index + 1}
                        {block.date && ` · ${dateHeading(block.date)}`}
                        {endLabel && ` · ${block.startTime}–${endLabel}`}
                      </span>
                      {blocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          aria-label={`Remove slot ${index + 1}`}
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor={`block-${block.id}-date`}>
                          Date
                        </label>
                        <input
                          id={`block-${block.id}-date`}
                          type="date"
                          min={toUkDateKey(new Date())}
                          value={block.date}
                          onChange={(event) => updateBlock(block.id, { date: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`block-${block.id}-start`}>
                          Start time
                        </label>
                        <div className="relative">
                          <Clock
                            size={13}
                            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            id={`block-${block.id}-start`}
                            type="time"
                            step={900}
                            value={block.startTime}
                            onChange={(event) => updateBlock(block.id, { startTime: event.target.value })}
                            className={`${inputClass} pl-8`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3" role="group" aria-label="Lesson length">
                      <span className={labelClass}>Length</span>
                      <div className="flex flex-wrap gap-2">
                        {LESSON_DURATIONS.map((duration) => (
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

                    {blockError && <p className="mt-2 text-[11px] font-medium text-red-500">{blockError}</p>}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addBlock}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50"
              >
                <Plus size={14} />
                Add another slot
              </button>
            </section>
          ) : (
            <>
              <section role="group" aria-labelledby="availability-days-label">
                <div className="mb-1.5 flex items-center justify-between">
                  <span id="availability-days-label" className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    1 · Which days?
                  </span>
                  <div className="flex gap-3">
                    {DAY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateWindow({ days: preset.days })}
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
                      aria-pressed={windowForm.days.includes(index)}
                      aria-label={day}
                      onClick={() => toggleDay(index)}
                      className={chipClass(windowForm.days.includes(index))}
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
                      value={windowForm.from}
                      onChange={(event) => updateWindow({ from: event.target.value })}
                      aria-label="From"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="time"
                    step={900}
                    value={windowForm.to}
                    onChange={(event) => updateWindow({ to: event.target.value })}
                    aria-label="To"
                    className={`${inputClass} flex-1`}
                  />
                </div>
                {timeWindowInvalid && (
                  <p className="mt-1.5 text-[11px] font-medium text-red-500">End time must be after start time.</p>
                )}
              </section>

              <section role="group" aria-label="Lesson length">
                <span className={labelClass}>3 · Lesson length</span>
                <div className="flex flex-wrap gap-2">
                  {LESSON_DURATIONS.map((length) => (
                    <button
                      key={length}
                      type="button"
                      aria-pressed={windowForm.lessonLength === length}
                      onClick={() => updateWindow({ lessonLength: length })}
                      className={chipClass(windowForm.lessonLength === length)}
                    >
                      {durationLabel(length)}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Your hours are split into back-to-back lessons of this length.
                  {leftoverMinutes > 0 &&
                    ` The last ${leftoverMinutes} min won't be used — lessons are 1, 1.5 or 2 hours.`}
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
                    min={toUkDateKey(new Date())}
                    value={windowForm.startDate}
                    onChange={(event) => updateWindow({ startDate: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div role="group" aria-label="Repeat for">
                  <span className={labelClass}>Repeat</span>
                  <div className="flex flex-wrap gap-2">
                    {REPEAT_OPTIONS.map((weeks) => (
                      <button
                        key={weeks}
                        type="button"
                        aria-pressed={windowForm.weeks === weeks}
                        onClick={() => updateWindow({ weeks })}
                        className={chipClass(windowForm.weeks === weeks)}
                      >
                        {weeks === 1 ? "Just once" : `${weeks} wks`}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {windowSlots.length === 0
                      ? "Preview"
                      : `${pluralise(windowSlots.length, "new slot")} across ${pluralise(
                          new Set(windowSlots.map((s) => s.date)).size,
                          "day",
                        )}`}
                    {clashCount > 0 && (
                      <span className="ml-2 font-medium text-slate-400">
                        · {clashCount} already set
                      </span>
                    )}
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

                {generated.length === 0 ? (
                  <p className="text-xs text-slate-400">{validationMessage ?? "Slots you create will appear here."}</p>
                ) : (
                  <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                    {groupedGenerated.map(([date, daySlots]) => (
                      <div key={date}>
                        <p className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {dateHeading(date)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {daySlots.map((slot) =>
                            isClash(slot) ? (
                              <span
                                key={slot.key}
                                title="You already have availability at this time — it won't be duplicated."
                                className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-400 line-through dark:border-slate-700"
                              >
                                {slot.startTime}–{slot.endTime}
                              </span>
                            ) : (
                              <span
                                key={slot.key}
                                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                              >
                                {slot.startTime}–{slot.endTime}
                                <button
                                  type="button"
                                  onClick={() => setRemovedKeys((previous) => new Set(previous).add(slot.key))}
                                  aria-label={`Remove ${dateHeading(date)} ${slot.startTime}`}
                                  className="cursor-pointer rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900"
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

      </form>
    </Modal>
  );
};

export default SetAvailabilityModal;
