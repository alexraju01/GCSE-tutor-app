"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, CalendarX } from "lucide-react";
import { cancelLessonAction } from "@utils/actions/lesson.action";

interface CancelLessonButtonProps {
  lessonId: string;
}

const CancelLessonButton = ({ lessonId }: CancelLessonButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Same dismiss pattern as the subject dropdown elsewhere in this app —
  // click outside or Escape closes the confirmation without cancelling.
  useEffect(() => {
    if (!isConfirming) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsConfirming(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsConfirming(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirming]);

  const handleConfirmCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelLessonAction(lessonId);
      if (result.status === "error") {
        setError(result.message || "Failed to cancel the lesson.");
        setIsConfirming(false);
      }
      // On success the page revalidates and this lesson re-renders with
      // status "Cancelled" (or drops out of the list under an active
      // filter) — either way this button won't be shown again.
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsConfirming((open) => !open)}
        aria-expanded={isConfirming}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <CalendarX size={14} />
        Cancel Lesson
      </button>

      {error && !isConfirming && (
        <p className="mt-1 text-right text-[10px] text-red-500">{error}</p>
      )}

      {isConfirming && (
        <div
          role="dialog"
          aria-label="Confirm lesson cancellation"
          className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Cancel this lesson?
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                This can&apos;t be undone. The slot will open back up for
                other students.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Cancelling..." : "Yes, Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelLessonButton;
