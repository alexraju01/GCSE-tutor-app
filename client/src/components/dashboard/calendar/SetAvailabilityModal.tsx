"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";

import { Modal } from "@components/ui/modal";
import { Select } from "@components/ui/select";
import { LESSON_DURATIONS } from "@constants/index";
import {
  createRecurringAvailabilityAction,
  getMyAvailabilityAction,
} from "@utils/actions/availability";
import { cn } from "@utils/cn";
import { pluralise } from "@utils/format";
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
import { buttonClass } from "@components/ui/styles";
import { inputClass, labelClass } from "@components/ui/styles";

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

// keep in sync with the recurring availability schema on the server
const REPEAT_OPTIONS = [
  { weeks: 1, label: "Just this once" },
  { weeks: 2, label: "Every week for 2 weeks" },
  { weeks: 4, label: "Every week for 4 weeks" },
  { weeks: 8, label: "Every week for 8 weeks" },
  { weeks: 12, label: "Every week for 12 weeks" },
];

interface Slot {
  key: string; // "YYYY-MM-DD|HH:mm" - the server's exclude format
  start: number; // epoch ms
  end: number;
}

interface FormState {
  date: string;
  from: string;
  to: string;
  lessonLength: number;
  weeks: number;
}

// next full hour at least an hour away, or tomorrow 16:00 if it's getting late
const defaultForm = (): FormState => {
  const now = new Date();
  const { hour, minute } = getUkDateParts(now);
  const nextHour = hour + (minute > 0 ? 2 : 1);
  const useToday = nextHour <= 19;
  const start = useToday ? nextHour * 60 : 16 * 60;
  return {
    date: useToday ? toUkDateKey(now) : addDaysToKey(toUkDateKey(now), 1),
    from: minutesToHHMM(start),
    to: minutesToHHMM(start + 120),
    lessonLength: 60,
    weeks: 1,
  };
};

const formFromDraft = (draft?: AvailabilityDraft | null): FormState =>
  draft ? { ...draft, lessonLength: 60, weeks: 1 } : defaultForm();

// every lesson the form would create, back to back inside from–to, repeated weekly
const buildSlots = ({ date, from, to, lessonLength, weeks }: FormState): Slot[] => {
  if (!date || !from || !to) return [];
  const fromMinutes = hhmmToMinutes(from);
  const toMinutes = hhmmToMinutes(to);
  const now = Date.now();
  const slots: Slot[] = [];

  for (let week = 0; week < weeks; week++) {
    const day = addDaysToKey(date, week * 7);
    for (let start = fromMinutes; start + lessonLength <= toMinutes; start += lessonLength) {
      const startMs = ukInstant(day, start).getTime();
      if (startMs <= now) continue;
      slots.push({ key: `${day}|${minutesToHHMM(start)}`, start: startMs, end: startMs + lessonLength * 60_000 });
    }
  }
  return slots;
};

const lengthLabel = (minutes: number) => (minutes === 90 ? "1.5h" : `${minutes / 60}h`);


const SetAvailabilityModal = ({ open, onClose, draft, onSaved }: SetAvailabilityModalProps) => {
  const [isPending, startTransition] = useTransition();
  // the planner remounts this per open (key), so initial state is always the latest draft
  const [form, setForm] = useState<FormState>(() => formFromDraft(draft));
  const [existing, setExisting] = useState<{ start: number; end: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<FormState>) => {
    setError(null);
    setForm((previous) => ({ ...previous, ...patch }));
  };

  // load existing slots in the range so clashes are counted before saving
  const spanKey = form.date ? `${form.date}|${form.weeks}` : "";
  useEffect(() => {
    if (!open || !form.date) return;
    let ignore = false;
    const from = ukInstant(form.date).toISOString();
    const to = ukInstant(addDaysToKey(form.date, form.weeks * 7)).toISOString();

    void getMyAvailabilityAction(from, to).then((result) => {
      if (ignore || !result.ok) return;
      setExisting(
        result.data.map((slot) => ({
          start: new Date(slot.startTime).getTime(),
          end: new Date(slot.endTime).getTime(),
        })),
      );
    });

    return () => {
      ignore = true;
    };
    // spanKey covers date + weeks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spanKey]);

  const allSlots = useMemo(() => buildSlots(form), [form]);
  const clashes = allSlots.filter((slot) => existing.some((e) => e.start < slot.end && slot.start < e.end));
  const newSlots = allSlots.filter((slot) => !clashes.includes(slot));

  const windowMinutes = hhmmToMinutes(form.to || "00:00") - hhmmToMinutes(form.from || "00:00");
  const lessonsPerDay = windowMinutes > 0 ? Math.floor(windowMinutes / form.lessonLength) : 0;
  const leftover = lessonsPerDay > 0 ? windowMinutes % form.lessonLength : 0;
  const firstDayTimes = Array.from({ length: lessonsPerDay }, (_, i) => {
    const start = hhmmToMinutes(form.from) + i * form.lessonLength;
    return `${minutesToHHMM(start)}–${minutesToHHMM(start + form.lessonLength)}`;
  });

  const problem = (() => {
    if (!form.date || !form.from || !form.to) return "Pick a date and times.";
    if (windowMinutes <= 0) return "The end time must be after the start time.";
    if (lessonsPerDay === 0) return `That's shorter than a ${lengthLabel(form.lessonLength)} lesson.`;
    if (allSlots.length === 0) return "These times have already passed.";
    if (newSlots.length === 0) return "You already have availability at all of these times.";
    return null;
  })();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (problem) {
      setError(problem);
      return;
    }

    startTransition(async () => {
      const result = await createRecurringAvailabilityAction({
        days: [dayIndexOfKey(form.date)],
        startDate: form.date,
        from: form.from,
        to: form.to,
        lessonLength: form.lessonLength,
        weeks: form.weeks,
        // skip known clashes up front
        exclude: clashes.map((slot) => slot.key),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved({ created: result.data.created.length, skipped: result.data.skipped.length + clashes.length });
      onClose();
    });
  };

  const weekday = form.date ? formatDayKey(form.date, { weekday: "long" }) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isPending}
      size="max-w-md"
      title="Add availability"
      description="Times are UK time."
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={buttonClass("ghost")}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="set-availability-form"
            disabled={isPending || !!problem}
            className={buttonClass("primary")}
          >
            <CalendarPlus size={14} />
            {isPending ? "Saving..." : `Add ${pluralise(newSlots.length, "slot")}`}
          </button>
        </div>
      }
    >
      <form id="set-availability-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="availability-date" className={labelClass}>
              Date
            </label>
            <input
              id="availability-date"
              type="date"
              min={toUkDateKey(new Date())}
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="availability-from" className={labelClass}>
              From
            </label>
            <input
              id="availability-from"
              type="time"
              step={1800}
              value={form.from}
              onChange={(e) => update({ from: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="availability-to" className={labelClass}>
              To
            </label>
            <input
              id="availability-to"
              type="time"
              step={1800}
              value={form.to}
              onChange={(e) => update({ to: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div role="radiogroup" aria-label="Lesson length">
          <span className={labelClass}>Lesson length</span>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
            {LESSON_DURATIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                role="radio"
                aria-checked={form.lessonLength === minutes}
                onClick={() => update({ lessonLength: minutes })}
                className={cn(
                  "cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-colors",
                  form.lessonLength === minutes
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400",
                )}
              >
                {lengthLabel(minutes)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="availability-repeat" className={labelClass}>
            Repeat
          </label>
          <Select
            id="availability-repeat"
            value={form.weeks}
            onChange={(weeks) => update({ weeks })}
            options={REPEAT_OPTIONS.map((option) => ({
              value: option.weeks,
              label: option.weeks === 1 ? option.label : `${option.label} (${weekday}s)`,
            }))}
          />
        </div>

        {/* one-line summary of what gets created */}
        <div
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-xs",
            error || problem
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : "border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
          )}
        >
          {error ?? problem ?? (
            <>
              <p className="font-semibold">
                {pluralise(lessonsPerDay, `${lengthLabel(form.lessonLength)} lesson`)}: {firstDayTimes.join(", ")}
              </p>
              <p className="mt-0.5 opacity-80">
                {form.weeks > 1
                  ? `Every ${weekday} for ${form.weeks} weeks · ${pluralise(newSlots.length, "slot")} in total`
                  : formatDayKey(form.date, { weekday: "long", day: "numeric", month: "long" })}
                {clashes.length > 0 && ` · ${clashes.length} already set, skipped`}
                {leftover > 0 && ` · last ${leftover} min not used`}
              </p>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default SetAvailabilityModal;
