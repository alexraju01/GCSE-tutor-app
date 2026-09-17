import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, Video } from "lucide-react";
import { formatScheduleDate, formatTimeRange } from "@utils/date";
import StatusBadge from "@components/dashboard/StatusBadge";

export interface FormattedLesson {
  id: string;
  topic: string;
  subject: string;
  startTime: string;
  duration: number;
  status: string;
  student?: { name: string; image?: string | null };
  teacher?: { name: string; image?: string | null };
}

interface ScheduleItemCardProps {
  lesson: FormattedLesson;
  isTeacher: boolean;
}

const ScheduleItemCard = ({ lesson, isTeacher }: ScheduleItemCardProps) => {
  const { startDate, formattedDate } = formatScheduleDate(lesson.startTime);
  const timeRange = formatTimeRange(startDate, lesson.duration);

  // Allow entering the classroom for active future bookings (Upcoming or Confirmed)
  const isJoinable =
    lesson.status === "Upcoming" || lesson.status === "Confirmed";

  const targetPerson = isTeacher ? lesson.student : lesson.teacher;
  const personName = targetPerson?.name || "Unknown";
  const personImage = targetPerson?.image;
  const roleLabel = isTeacher ? "Student" : "Tutor";
  const meetingUrl = isJoinable
    ? (`/dashboard/lessons/${lesson.id}` as Route)
    : undefined;

  const initials = personName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 md:flex-row md:items-center">
      {/* Time & Status Column */}
      <div className="flex items-start gap-4 md:w-1/3">
        <div className="flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formattedDate}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {timeRange} ({lesson.duration} mins)
          </p>
          <StatusBadge status={lesson.status} className="mt-2" />
        </div>
      </div>

      {/* Participant Avatar & Subject Details Column */}
      <div className="flex items-center gap-3.5 md:w-1/3">
        {personImage ? (
          <Image
            src={personImage}
            alt={personName}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            {initials}
          </div>
        )}
        <div className="min-w-0 space-y-0.5">
          <span className="inline-block rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            {lesson.subject}
          </span>
          <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">
            {lesson.topic}
          </h3>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {roleLabel}:{" "}
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {personName}
            </strong>
          </p>
        </div>
      </div>

      {/* Actions Column */}
      <div className="flex items-center justify-end gap-3 md:w-1/3">
        {isJoinable && meetingUrl ? (
          <Link
            href={meetingUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.98]"
          >
            <Video size={14} /> Enter Classroom
          </Link>
        ) : (
          <button
            disabled
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 opacity-50 dark:border-slate-800 dark:text-slate-400"
          >
            View Notes
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduleItemCard;
