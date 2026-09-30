import type { ChangeEvent } from "react";
import { BookOpen } from "lucide-react";
import { Select } from "@components/ui/select";
import type { BookingState } from "./useBookLessonModal";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600";

const LessonDetailsForm = ({ booking }: { booking: BookingState }) => {
  const {
    availableSubjects: subjects,
    activeDetails: details,
    updateActiveDetails: onChange,
    activeSlotId,
    selectedSlots,
    applyDetailsToAll: onApplyToAll,
  } = booking;
  // true when editing a selected lesson, false when setting defaults for the next pick
  const hasActiveLesson = activeSlotId !== null;
  const selectedCount = selectedSlots.length;

  return (
  <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
    <div className="flex items-center justify-between gap-2">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        3. Lesson Details
      </span>
      {selectedCount > 1 && hasActiveLesson && (
        <button
          type="button"
          onClick={onApplyToAll}
          className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          Apply to all {selectedCount} lessons
        </button>
      )}
    </div>
    <p className="text-[11px] text-slate-400">
      {hasActiveLesson
        ? "Editing the highlighted lesson in your summary — click another lesson there to edit it."
        : "These details apply to the next time slot you pick."}
    </p>

    <div>
      <label htmlFor="lesson-subject" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
        Subject
      </label>
      <Select
        id="lesson-subject"
        icon={<BookOpen size={15} />}
        value={details.subject}
        onChange={(subject) => onChange({ subject })}
        options={subjects.map((subject) => ({ value: subject, label: subject.replace(/_/g, " ") }))}
        disabled={subjects.length === 0}
      />
    </div>

    <div>
      <label htmlFor="lesson-topic" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
        Topic (Optional)
      </label>
      <input
        id="lesson-topic"
        type="text"
        value={details.topic}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ topic: e.target.value })}
        maxLength={255}
        placeholder="e.g., Integration by parts, Organic Chemistry"
        className={inputClass}
      />
    </div>

    <div>
      <label htmlFor="lesson-notes" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
        Notes for your tutor (Optional)
      </label>
      <textarea
        id="lesson-notes"
        rows={2}
        value={details.notes}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange({ notes: e.target.value })}
        maxLength={255}
        placeholder="e.g., Mock exam next week — please focus on past papers."
        className={inputClass}
      />
    </div>
  </div>
  );
};

export default LessonDetailsForm;
