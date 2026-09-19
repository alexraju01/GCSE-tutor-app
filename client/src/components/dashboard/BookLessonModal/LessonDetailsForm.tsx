import type { ChangeEvent } from "react";
import SubjectDropdown from "./SubjectDropdown";

interface LessonDetailsFormProps {
  subjects: string[];
  subject: string;
  onSubjectChange: (subject: string) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const LessonDetailsForm = ({
  subjects,
  subject,
  onSubjectChange,
  topic,
  onTopicChange,
  notes,
  onNotesChange,
}: LessonDetailsFormProps) => {
  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        3. Lesson Details
      </span>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Subject
        </label>
        <SubjectDropdown
          subjects={subjects}
          value={subject}
          onChange={onSubjectChange}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Topic (Optional)
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onTopicChange(e.target.value)
          }
          maxLength={255}
          placeholder="e.g., Integration by parts, Organic Chemistry"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Additional Notes (Optional)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onNotesChange(e.target.value)
          }
          maxLength={255}
          placeholder="Add requests or details for the session..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600"
        />
      </div>
    </div>
  );
};

export default LessonDetailsForm;
