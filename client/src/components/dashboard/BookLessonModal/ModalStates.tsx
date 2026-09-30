import { AlertCircle, CalendarX, Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { BookingPolicy } from "@/types/teacher";
import AddToCalendarButton from "@components/dashboard/schedule/AddToCalendarButton";
import { formatSubject } from "@utils/format";
import { buttonClass } from "@components/ui/styles";

export const LoadingState = () => (
  <div role="status" className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
    Loading availability calendar...
  </div>
);

export const ErrorState = ({
  teacherName,
  onRetry,
}: {
  teacherName: string | null;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
      <AlertCircle size={26} />
    </div>
    <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
      Couldn&apos;t load availability
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      Something went wrong while fetching {teacherName ? `${teacherName}'s` : "this teacher's"} time
      slots. Please try again.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className={buttonClass("primary", "md", "mt-5")}
    >
      Try again
    </button>
  </div>
);

export const EmptyState = ({
  teacherName,
  policy,
}: {
  teacherName: string | null;
  policy: BookingPolicy | null;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      <CalendarX size={26} />
    </div>
    <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
      {teacherName || "This teacher"} is fully booked for now
    </h3>
    <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      There are no open lesson times at the moment. Teachers add new slots regularly, so it&apos;s
      worth checking back soon.
    </p>
    {policy && policy.minNoticeHours > 0 && (
      <p className="mt-1 max-w-sm text-xs text-slate-400">
        This tutor needs at least {policy.minNoticeHours} hours&apos; notice and takes bookings up to{" "}
        {policy.maxAdvanceDays} days ahead.
      </p>
    )}
    <div className="mt-5 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left dark:border-slate-800 dark:bg-slate-800/30">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        In the meantime
      </span>
      <ul className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        <li>• Browse other teachers who teach the same subject.</li>
        <li>• Come back later — new times appear as they&apos;re added.</li>
      </ul>
    </div>
  </div>
);

// "Maths", "Maths and Physics", "Maths, Physics and Chemistry"
const joinSubjects = (subjects: string[]) =>
  subjects.length <= 1
    ? (subjects[0] ?? "")
    : `${subjects.slice(0, -1).join(", ")} and ${subjects[subjects.length - 1]}`;

const successHeading = (count: number, requiresApproval: boolean) => {
  if (requiresApproval) return count === 1 ? "Request sent!" : `${count} requests sent!`;
  return count === 1 ? "Booking confirmed!" : "Bookings confirmed!";
};

export const SuccessState = ({
  lessons,
  teacherName,
  requiresApproval,
  onDone,
}: {
  lessons: Lesson[];
  teacherName: string | null;
  requiresApproval: boolean;
  onDone: () => void;
}) => {
  const count = lessons.length;
  const subjects = joinSubjects(Array.from(new Set(lessons.map((l) => formatSubject(l.subject)))));
  const tutor = teacherName ?? "your tutor";
  const lessonWord = count === 1 ? "lesson" : "lessons";

  return (
    <div role="status" className="flex flex-col items-center justify-center py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
        <Check size={32} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
        {successHeading(count, requiresApproval)}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {requiresApproval
          ? `${tutor} will review your ${subjects} ${lessonWord} — we'll let you know as soon as they respond.`
          : `Your ${count === 1 ? "" : `${count} `}${subjects} ${count === 1 ? "lesson is" : "lessons are"} booked with ${tutor}.`}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!requiresApproval && (
          <AddToCalendarButton
            events={lessons.map((lesson) => ({
              id: lesson.id,
              title: `${formatSubject(lesson.subject)} lesson with ${tutor}`,
              start: new Date(lesson.startTime),
              durationMinutes: lesson.duration,
              description: lesson.topic ?? undefined,
            }))}
            filename={count === 1 ? "lesson.ics" : "lessons.ics"}
            label={count === 1 ? "Add to calendar" : `Add all ${count} to calendar`}
            className="px-4 py-2"
          />
        )}
        <Link
          href={"/dashboard/schedule" as Route}
          onClick={onDone}
          className={buttonClass("primary")}
        >
          View my schedule
        </Link>
        <button
          type="button"
          onClick={onDone}
          className={buttonClass("ghost")}
        >
          Done
        </button>
      </div>
    </div>
  );
};
