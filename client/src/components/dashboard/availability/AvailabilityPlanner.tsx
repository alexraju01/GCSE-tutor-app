"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronLeft, ChevronRight, Copy, Eraser, Loader2 } from "lucide-react";
import { toast } from "sonner";

import SetAvailabilityModal, {
  type AvailabilityDraft,
} from "@components/dashboard/calendar/SetAvailabilityModal";
import { Modal } from "@components/ui/modal";
import {
  createAvailabilityAction,
  getMyAvailabilityAction,
  removeAvailabilityAction,
  removeSeriesAction,
} from "@utils/actions/availability";
import { respondToLessonAction } from "@utils/actions/lesson.action";
import type { AvailabilityPayloadItem, OwnAvailabilitySlot } from "@utils/api";
import {
  addDaysToKey,
  formatDayKey,
  getUkDateParts,
  minutesToHHMM,
  ukInstant,
  ukMinutesOfDay,
  ukWeekStartKey,
} from "@utils/ukTime";
import SlotDetailsModal from "./SlotDetailsModal";
import WeekGrid, { weekRange, type CreateRange } from "./WeekGrid";

interface AvailabilityPlannerProps {
  initialWeekStartKey: string;
  initialSlots: OwnAvailabilitySlot[];
}

const pluralise = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const slotMinutes = (slot: { startTime: string; endTime: string }) =>
  Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60_000);

// used by undo to recreate a deleted slot
const toPayload = (slot: OwnAvailabilitySlot): AvailabilityPayloadItem => ({
  startTime: slot.startTime,
  durationInMinutes: slotMinutes(slot),
});

const isOpenFuture = (slot: OwnAvailabilitySlot, now: Date) =>
  !slot.isBooked && new Date(slot.startTime) > now;

const AvailabilityPlanner = ({ initialWeekStartKey, initialSlots }: AvailabilityPlannerProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [weekStartKey, setWeekStartKey] = useState(initialWeekStartKey);
  const [slots, setSlots] = useState<OwnAvailabilitySlot[]>(initialSlots);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draft, setDraft] = useState<AvailabilityDraft | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<OwnAvailabilitySlot | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // keeps the "now" line moving
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadWeek = useCallback(async (key: string) => {
    const { from, to } = weekRange(key);
    setIsLoading(true);
    setLoadError(null);
    const result = await getMyAvailabilityAction(from.toISOString(), to.toISOString());
    setIsLoading(false);
    if (result.ok) {
      setSlots(result.data);
    } else {
      setLoadError(result.error);
    }
  }, []);

  const goToWeek = (key: string) => {
    setWeekStartKey(key);
    void loadWeek(key);
  };

  const refresh = () => {
    void loadWeek(weekStartKey);
    router.refresh();
  };

  const thisWeekKey = ukWeekStartKey(now);
  const weekEndKey = addDaysToKey(weekStartKey, 6);
  const rangeLabel = `${formatDayKey(weekStartKey, { day: "numeric", month: "short" })} – ${formatDayKey(
    weekEndKey,
    { day: "numeric", month: "short", year: "numeric" },
  )}`;

  const openCount = slots.filter((s) => isOpenFuture(s, now)).length;
  const bookedCount = slots.filter((s) => s.lesson && s.lesson.status !== "Pending").length;
  const pendingCount = slots.filter((s) => s.lesson?.status === "Pending").length;

  // --- Mutations ---------------------------------------------------------

  const restoreSlots = (payload: AvailabilityPayloadItem[]) => {
    startTransition(async () => {
      const result = await createAvailabilityAction(payload);
      if (result.ok) {
        toast.success(`Restored ${pluralise(result.data.length, "slot")}.`);
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const deleteSlots = (toDelete: OwnAvailabilitySlot[], successMessage: string) => {
    startTransition(async () => {
      const result = await removeAvailabilityAction(toDelete.map((s) => s.id));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const future = toDelete.filter((s) => new Date(s.startTime) > new Date());
      toast.success(successMessage, {
        action: future.length > 0 ? { label: "Undo", onClick: () => restoreSlots(future.map(toPayload)) } : undefined,
      });
      setSelectedSlot(null);
      setConfirmClear(false);
      refresh();
    });
  };

  const handleDeleteSeries = (seriesId: string) => {
    startTransition(async () => {
      const result = await removeSeriesAction(seriesId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { deleted, keptBooked } = result.data;
      toast.success(
        `Removed ${pluralise(deleted.length, "upcoming slot")} from the series.` +
          (keptBooked.length > 0 ? ` ${pluralise(keptBooked.length, "booked slot")} kept.` : ""),
      );
      setSelectedSlot(null);
      refresh();
    });
  };

  const handleRespond = (lessonId: string, decision: "approve" | "decline") => {
    startTransition(async () => {
      const result = await respondToLessonAction(lessonId, decision);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(decision === "approve" ? "Lesson confirmed — the student has been notified." : "Request declined.");
      setSelectedSlot(null);
      refresh();
    });
  };

  // copy last week's slots to this week (same UK times), skipping clashes and past times
  const handleCopyPreviousWeek = () => {
    startTransition(async () => {
      const previousKey = addDaysToKey(weekStartKey, -7);
      const { from, to } = weekRange(previousKey);
      const previous = await getMyAvailabilityAction(from.toISOString(), to.toISOString());
      if (!previous.ok) {
        toast.error(previous.error);
        return;
      }

      const current = new Date();
      const candidates = previous.data.map((slot) => {
        const start = new Date(slot.startTime);
        const { year, month, day } = getUkDateParts(start);
        const dateKey = addDaysToKey(
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          7,
        );
        const shiftedStart = ukInstant(dateKey, ukMinutesOfDay(start));
        const duration = slotMinutes(slot);
        return { start: shiftedStart, end: new Date(shiftedStart.getTime() + duration * 60_000), duration };
      });

      const toCreate = candidates.filter(
        (c) =>
          c.start > current &&
          !slots.some((s) => new Date(s.startTime) < c.end && c.start < new Date(s.endTime)),
      );
      const skipped = candidates.length - toCreate.length;

      if (candidates.length === 0) {
        toast.info("Last week had no availability to copy.");
        return;
      }
      if (toCreate.length === 0) {
        toast.info("Nothing to copy — those times are already set or have passed.");
        return;
      }

      const result = await createAvailabilityAction(
        toCreate.map((c) => ({ startTime: c.start.toISOString(), durationInMinutes: c.duration })),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Copied ${pluralise(result.data.length, "slot")} from last week.` +
          (skipped > 0 ? ` ${skipped} skipped (already set or in the past).` : ""),
      );
      refresh();
    });
  };

  const clearableSlots = slots.filter((s) => isOpenFuture(s, now));

  const handleCreateRange = ({ date, fromMinutes, toMinutes }: CreateRange) => {
    if (ukInstant(date, fromMinutes) <= new Date()) {
      toast.info("That time has already passed — pick a time later than now.");
      return;
    }
    setDraft({ date, from: minutesToHHMM(fromMinutes), to: minutesToHHMM(toMinutes) });
    setIsAddOpen(true);
  };

  const handleSaved = ({ created, skipped }: { created: number; skipped: number }) => {
    toast.success(
      `Added ${pluralise(created, "slot")}.` +
        (skipped > 0 ? ` ${skipped} skipped because you already had availability then.` : ""),
    );
    refresh();
  };

  const navButton =
    "rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800";
  const toolButton =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => goToWeek(addDaysToKey(weekStartKey, -7))}
            className={navButton}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => goToWeek(addDaysToKey(weekStartKey, 7))}
            className={navButton}
          >
            <ChevronRight size={16} />
          </button>
          {weekStartKey !== thisWeekKey && (
            <button type="button" onClick={() => goToWeek(thisWeekKey)} className={toolButton}>
              This week
            </button>
          )}
          <span className="ml-1 text-sm font-bold text-slate-800 dark:text-slate-100">{rangeLabel}</span>
          {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" aria-label="Loading" />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopyPreviousWeek} disabled={isPending} className={toolButton}>
            <Copy size={14} /> Copy last week
          </button>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={isPending || clearableSlots.length === 0}
            className={toolButton}
          >
            <Eraser size={14} /> Clear open slots
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setIsAddOpen(true);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            <CalendarPlus size={14} /> Add availability
          </button>
        </div>
      </div>

      {/* Week summary + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p>
          This week: <strong className="text-slate-800 dark:text-slate-200">{openCount} open</strong> ·{" "}
          <strong className="text-slate-800 dark:text-slate-200">{bookedCount} booked</strong>
          {pendingCount > 0 && (
            <>
              {" "}
              ·{" "}
              <strong className="text-amber-600 dark:text-amber-400">
                {pluralise(pendingCount, "request")} awaiting you
              </strong>
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-400" /> Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Request
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> Booked
          </span>
          <span className="hidden sm:inline">Drag on the grid to add hours · times are UK</span>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadWeek(weekStartKey)} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      <WeekGrid
        weekStartKey={weekStartKey}
        slots={slots}
        now={now}
        onSlotClick={setSelectedSlot}
        onCreateRange={handleCreateRange}
      />

      <SetAvailabilityModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        draft={draft}
        onSaved={handleSaved}
      />

      <SlotDetailsModal
        slot={selectedSlot}
        busy={isPending}
        onClose={() => setSelectedSlot(null)}
        onDeleteSlot={(slot) => deleteSlots([slot], "Slot removed.")}
        onDeleteSeries={handleDeleteSeries}
        onRespond={handleRespond}
      />

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        dismissible={!isPending}
        size="max-w-sm"
        title="Clear this week's open slots?"
        description={`${pluralise(clearableSlots.length, "open slot")} between ${formatDayKey(weekStartKey, {
          day: "numeric",
          month: "short",
        })} and ${formatDayKey(weekEndKey, { day: "numeric", month: "short" })}. Booked lessons aren't affected.`}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              disabled={isPending}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Keep them
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => deleteSlots(clearableSlots, `Cleared ${pluralise(clearableSlots.length, "slot")}.`)}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Clearing..." : "Clear slots"}
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">You can undo this straight after.</p>
      </Modal>
    </div>
  );
};

export default AvailabilityPlanner;

