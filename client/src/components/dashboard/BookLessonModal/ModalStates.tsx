import { AlertCircle, CalendarX, Check } from "lucide-react";

export const LoadingState = () => (
  <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
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
      Something went wrong while fetching{" "}
      {teacherName ? `${teacherName}'s` : "this teacher's"} time slots. Please
      try again.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-5 cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700"
    >
      Try again
    </button>
  </div>
);

export const EmptyState = ({ teacherName }: { teacherName: string | null }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      <CalendarX size={26} />
    </div>
    <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
      {teacherName || "This teacher"} is fully booked for now
    </h3>
    <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      There are no open lesson times at the moment. Teachers add new slots
      regularly, so it&apos;s worth checking back soon.
    </p>
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

export const SuccessState = ({
  bookedCount,
  subjects,
}: {
  bookedCount: number;
  subjects: string[];
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
      <Check size={32} />
    </div>
    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
      {bookedCount === 1 ? "Booking confirmed!" : "Bookings confirmed!"}
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      {bookedCount === 1
        ? `Your ${joinSubjects(subjects)} lesson is booked.`
        : `${bookedCount} ${joinSubjects(subjects)} lessons are booked.`}{" "}
      You&apos;ll find {bookedCount === 1 ? "it" : "them"} on your schedule.
    </p>
  </div>
);
