"use client";

import type { Route } from "next";
import Link from "next/link";

import { CalendarClock, Check, Repeat, Trash2, User, X } from "lucide-react";

import { ROUTES } from "@/constants/routes";

import StatusBadge from "@components/dashboard/StatusBadge";
import { Modal } from "@components/ui/modal";
import { buttonClass } from "@components/ui/styles";
import type { OwnAvailabilitySlot } from "@utils/api";
import { formatSubject } from "@utils/format";
import { formatUkDate, formatUkTimeRange } from "@utils/ukTime";

interface SlotDetailsModalProps {
  slot: OwnAvailabilitySlot | null;
  busy: boolean;
  onClose: () => void;
  onDeleteSlot: (slot: OwnAvailabilitySlot) => void;
  onDeleteSeries: (seriesId: string) => void;
  onRespond: (lessonId: string, decision: "approve" | "decline") => void;
}

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
          ? `${formatUkDate(start, { weekday: "long", day: "numeric", month: "long" })} · ${formatUkTimeRange(start, end)} (UK)`
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
                      {formatSubject(lesson.subject)}
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
                  className={buttonClass("success", "md", "w-full py-2.5")}
                >
                  <Check size={14} /> Accept request
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRespond(lesson.id, "decline")}
                  className={buttonClass("secondary", "md", "w-full py-2.5")}
                >
                  <X size={14} /> Decline
                </button>
              </div>
            )}

            {lesson && (
              <Link
                href={`${ROUTES.DASHBOARD.SCHEDULE}?filter=all` as Route}
                className={buttonClass("secondary", "md", "w-full py-2.5")}
              >
                <CalendarClock size={14} /> Manage this lesson in your schedule
              </Link>
            )}

            {!lesson && !isPast && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteSlot(slot)}
                className={buttonClass("danger", "md", "w-full py-2.5")}
              >
                <Trash2 size={14} /> Remove this slot
              </button>
            )}

            {slot.seriesId && !isPast && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteSeries(slot.seriesId!)}
                className={buttonClass(
                  "secondary",
                  "md",
                  "w-full border-red-200 py-2.5 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30",
                )}
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
