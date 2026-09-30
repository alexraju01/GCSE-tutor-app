"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@components/ui/modal";
import { respondToLessonAction } from "@utils/actions/lesson.action";
import { buttonClass, labelClass, textareaClass } from "@components/ui/styles";

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
        className={buttonClass("success", "sm")}
      >
        <Check size={14} /> Accept
      </button>
      <button
        type="button"
        onClick={() => setIsDeclining(true)}
        disabled={isPending}
        className={buttonClass("secondary", "sm")}
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
              className={buttonClass("ghost", "sm")}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => respond("decline")}
              disabled={isPending}
              className={buttonClass("danger", "sm")}
            >
              {isPending ? "Declining..." : "Decline request"}
            </button>
          </div>
        }
      >
        <label htmlFor={`decline-reason-${lessonId}`} className={labelClass}>
          Message to the student <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={`decline-reason-${lessonId}`}
          rows={3}
          maxLength={255}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. I'm fully booked that week — could you try the following Tuesday?"
          className={textareaClass}
        />
      </Modal>
    </div>
  );
};

export default LessonRequestActions;
