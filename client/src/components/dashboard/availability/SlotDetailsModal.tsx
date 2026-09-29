"use client";

import { CalendarClock, Check, Repeat, Trash2, User, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import StatusBadge from "@components/dashboard/StatusBadge";
import { Modal } from "@components/ui/modal";
import type { OwnAvailabilitySlot } from "@utils/api";
import { formatUkDate, formatUkTime } from "@utils/ukTime";

interface SlotDetailsModalProps {
  slot: OwnAvailabilitySlot | null;
  busy: boolean;
  onClose: () => void;
  onDeleteSlot: (slot: OwnAvailabilitySlot) => void;
  onDeleteSeries: (seriesId: string) => void;
  onRespond: (lessonId: string, decision: "approve" | "decline") => void;
}

const actionButton =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const SlotDetailsModal = ({
  slot,
  busy,
  onClose,
  onDeleteSlot,
  onDeleteSeries,
  onRespond,
}: SlotDetailsModalProps) => {
  const start = slot ? new Date(slot.startTime) : null;
  const end = slot ? new Date(slot.endTime) : null;
  const isPast = end ? end <= new Date() : false;
  const lesson = slot?.lesson;

  return (
    <Modal
      open={slot !== null}
      onClose={onClose}
      dismissible={!busy}
      size="max-w-md"
      title={lesson ? "Booked slot" : "Open slot"}
      description={
        start && end
          ? `${formatUkDate(start, { weekday: "long", day: "numeric", month: "long" })} · ${formatUkTime(start)}–${formatUkTime(end)} (UK)`
          : undefined
      }
    >
      {slot && (
        <div className="space-y-4">
          {lesson ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {lesson.studentName ?? "Student"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lesson.subject.replace(/_/g, " ")}
                      {lesson.topic ? ` · ${lesson.topic}` : ""}
                    </p>
                  </div>
                </div>
                <StatusBadge status={lesson.status} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isPast
                ? "This slot has passed without being booked."
                : "Students can book this slot. Remove it if you're no longer free."}
            </p>
          )}

          {slot.seriesId && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Repeat size={12} /> Part of a weekly series.
            </p>
          )}

          <div className="space-y-2">
            {lesson?.status === "Pending" && !isPast && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRespond(lesson.id, "approve")}
                  className={`${actionButton} bg-emerald-600 text-white hover:bg-emerald-700`}
                >
                  <Check size={14} /> Accept request
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRespond(lesson.id, "decline")}
                  className={`${actionButton} border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800`}
                >
                  <X size={14} /> Decline
                </button>
              </div>
            )}

            {lesson && (
              <Link
                href={"/dashboard/schedule?filter=all" as Route}
                className={`${actionButton} border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800`}
              >
                <CalendarClock size={14} /> Manage this lesson in your schedule
              </Link>
            )}

            {!lesson && !isPast && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteSlot(slot)}
                className={`${actionButton} bg-red-600 text-white hover:bg-red-700`}
              >
                <Trash2 size={14} /> Remove this slot
              </button>
            )}

            {slot.seriesId && !isPast && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteSeries(slot.seriesId!)}
                className={`${actionButton} border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30`}
              >
                <Trash2 size={14} /> Remove all upcoming open slots in this series
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SlotDetailsModal;
