"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@components/ui/modal";
import { respondToLessonAction } from "@utils/actions/lesson.action";

interface LessonRequestActionsProps {
  lessonId: string;
  lessonLabel: string;
}

// tutor accept/decline buttons for a pending request
const LessonRequestActions = ({ lessonId, lessonLabel }: LessonRequestActionsProps) => {
  const [isPending, startTransition] = useTransition();
  const [isDeclining, setIsDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const respond = (decision: "approve" | "decline") => {
    startTransition(async () => {
      const result = await respondToLessonAction(lessonId, decision, decision === "decline" ? reason : undefined);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setIsDeclining(false);
      toast.success(
        decision === "approve"
          ? "Lesson confirmed — the student has been notified."
          : "Request declined — the student has been notified.",
      );
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => respond("approve")}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check size={14} /> Accept
      </button>
      <button
        type="button"
        onClick={() => setIsDeclining(true)}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <X size={14} /> Decline
      </button>

      <Modal
        open={isDeclining}
        onClose={() => setIsDeclining(false)}
        dismissible={!isPending}
        size="max-w-md"
        title="Decline this request?"
        description={lessonLabel}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeclining(false)}
              disabled={isPending}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => respond("decline")}
              disabled={isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Declining..." : "Decline request"}
            </button>
          </div>
        }
      >
        <label htmlFor={`decline-reason-${lessonId}`} className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
          Message to the student <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={`decline-reason-${lessonId}`}
          rows={3}
          maxLength={255}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. I'm fully booked that week — could you try the following Tuesday?"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        />
      </Modal>
    </div>
  );
};

export default LessonRequestActions;
