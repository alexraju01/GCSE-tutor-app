// UpcomingSessions.tsx
import { ArrowUpRight, Calendar, Clock, User, Video } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@components/dashboard/StatusBadge";

interface UpcomingSessionsProps {
  isTeacher: boolean;
  sessions?: (StudentSession | StudentUpcomingLesson)[];
}

const UpcomingSessions = ({
  isTeacher,
  sessions = [],
}: UpcomingSessionsProps) => {
  const title = isTeacher
    ? "Today's Teaching Schedule"
    : "Today's Learning Schedule";
  const roleLabel = isTeacher ? "Student" : "Tutor";

  return (
    <div className="space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <span className="h-5 w-1 rounded-full bg-linear-to-b from-blue-500 to-indigo-500" />
          {title}
        </h2>
        <Link
          href={"/dashboard/schedule" as Route}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Full Calendar <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar size={18} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              No upcoming sessions scheduled
            </h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              {isTeacher
                ? "Bookings from your students will show up here."
                : "Book a session with one of your tutors to get started."}
            </p>
          </div>
        ) : (
          sessions.map((sessionItem, index) => {
            const isNext = index === 0;
            const participantName = isTeacher
              ? (sessionItem as StudentSession).student
              : (sessionItem as StudentUpcomingLesson).teacher;
            const participantImage = isTeacher
              ? (sessionItem as StudentSession).studentImage
              : (sessionItem as StudentUpcomingLesson).teacherImage;

            return (
              <div
                key={sessionItem.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all sm:flex-row sm:items-center ${
                  isNext
                    ? "border-blue-200 bg-blue-50/40 hover:border-blue-300 dark:border-blue-500/30 dark:bg-blue-500/5 dark:hover:border-blue-500/50"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500">
                    {participantImage ? (
                      <Image
                        src={participantImage}
                        alt={participantName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User size={22} className="mt-1" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isNext && (
                        <span className="inline-flex items-center rounded-md bg-linear-to-r from-blue-600 to-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Up Next
                        </span>
                      )}
                      <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {sessionItem.subject}
                      </span>
                      <StatusBadge status={sessionItem.status} />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {sessionItem.topic}
                    </h3>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {sessionItem.time}
                      </span>
                      <span>
                        {roleLabel}:{" "}
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                          {participantName}
                        </strong>
                      </span>
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/lessons/${sessionItem.id}` as Route}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
                >
                  <Video size={14} /> Launch Classroom
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpcomingSessions;
