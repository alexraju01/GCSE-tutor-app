"use client";

import { useState, useTransition } from "react";
import { CalendarX } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@components/ui/modal";
import { cancelLessonAction } from "@utils/actions/lesson.action";

interface CancelLessonButtonProps {
  lessonId: string;
  isTeacher: boolean;
  isRequest: boolean;
  lessonLabel: string;
}

const CancelLessonButton = ({ lessonId, isTeacher, isRequest, lessonLabel }: CancelLessonButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reopenSlot, setReopenSlot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionLabel = isRequest && !isTeacher ? "Withdraw request" : "Cancel lesson";

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelLessonAction(lessonId, { reason, reopenSlot });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      toast.success(
        isRequest && !isTeacher
          ? "Request withdrawn."
          : "Lesson cancelled — the other person has been notified.",
      );
      // page revalidates and the card re-renders as Cancelled
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <CalendarX size={14} />
        {actionLabel}
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        dismissible={!isPending}
        size="max-w-md"
        title={`${actionLabel}?`}
        description={lessonLabel}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Cancelling..." : `Yes, ${actionLabel.toLowerCase()}`}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor={`cancel-reason-${lessonId}`}
              className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Reason <span className="font-normal text-slate-400">(optional, shared with the {isTeacher ? "student" : "tutor"})</span>
            </label>
            <textarea
              id={`cancel-reason-${lessonId}`}
              rows={3}
              maxLength={255}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={isTeacher ? "e.g. I'm unwell — sorry for the short notice." : "e.g. School trip that day."}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {isTeacher ? (
            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={reopenSlot}
                onChange={(event) => setReopenSlot(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-blue-600"
              />
              <span>
                Reopen this time for other students
                <span className="block text-slate-400">
                  Leave unticked if you can&apos;t teach then — the slot will be removed.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This can&apos;t be undone. The time will open back up for other students.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CancelLessonButton;
