import { ArrowLeft, Clock, Mail, StickyNote, User, Video } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import StatusBadge from "@components/dashboard/StatusBadge";
import AddToCalendarButton from "@components/dashboard/schedule/AddToCalendarButton";
import CancelLessonButton from "@components/dashboard/schedule/CancelLessonButton";
import LessonRequestActions from "@components/dashboard/schedule/LessonRequestActions";
import { requireSession } from "@utils/actions/session";
import { api } from "@utils/api";
import { formatScheduleDate, formatTimeRange } from "@utils/date";
import { ApiError } from "@utils/fetchData";
import { formatMoney, formatSubject } from "@utils/format";

interface LessonDetailsPageProps {
  params: Promise<{ lessonId: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getLesson = async (lessonId: string, token: string) => {
  // skip the round trip for ids that can't exist
  if (!UUID_PATTERN.test(lessonId)) notFound();

  try {
    const response = await api.lesson.getOne(lessonId, token);
    return response.data;
  } catch (error) {
    // someone else's lesson 404s too, so ids can't be probed
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
};

const LessonDetailsPage = async ({ params }: LessonDetailsPageProps) => {
  const { lessonId } = await params;
  const { token, isTeacher } = await requireSession();
  const lesson = await getLesson(lessonId, token);

  if (!lesson) notFound();

  const { startDate, formattedDate } = formatScheduleDate(lesson.startTime);
  const timeRange = formatTimeRange(startDate, lesson.duration);
  const subject = formatSubject(lesson.subject);
  const isUpcoming = startDate > new Date();

  const isBooked =
    lesson.status === "Upcoming" || lesson.status === "Confirmed";
  const isRequest = lesson.status === "Pending";
  const isReleased =
    lesson.status === "Cancelled" || lesson.status === "Declined";

  const otherPerson = isTeacher ? lesson.student : lesson.teacher;
  const otherPersonName = otherPerson?.name || "Unknown";
  const roleLabel = isTeacher ? "Student" : "Tutor";
  const lessonLabel = `${subject} · ${formattedDate}, ${timeRange} (UK)`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={ROUTES.DASHBOARD.LESSONS as Route}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={14} /> All lessons
      </Link>

      {/* HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {subject}
          </span>
          <StatusBadge status={lesson.status} />
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {lesson.topic || "General session"}
        </h1>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock size={15} /> {formattedDate}, {timeRange} (UK)
          </span>
          <span>{lesson.duration} mins</span>
          {lesson.priceAtBooking !== null && (
            <span>{formatMoney(lesson.priceAtBooking)}</span>
          )}
        </p>

        {(isBooked || isRequest) && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
            {isTeacher && isRequest && isUpcoming && (
              <LessonRequestActions
                lessonId={lesson.id}
                lessonLabel={lessonLabel}
              />
            )}
            {isBooked && (
              <AddToCalendarButton
                events={[
                  {
                    id: lesson.id,
                    title: `${subject} lesson with ${otherPersonName}`,
                    start: startDate,
                    durationMinutes: lesson.duration,
                    description: lesson.topic ?? undefined,
                  },
                ]}
                filename={`lesson-${lesson.id}.ics`}
              />
            )}
            {/* tutors decline requests, they only cancel once it's booked */}
            {lesson.canCancel && !(isTeacher && isRequest) && (
              <CancelLessonButton
                lessonId={lesson.id}
                isTeacher={isTeacher}
                isRequest={isRequest}
                lessonLabel={lessonLabel}
              />
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* CLASSROOM */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Video size={16} className="text-blue-600 dark:text-blue-400" />
            Classroom
          </h2>
          <ClassroomStatus
            lesson={lesson}
            isTeacher={isTeacher}
            isBooked={isBooked}
            isRequest={isRequest}
            isReleased={isReleased}
            otherPersonName={otherPersonName}
          />
        </div>

        {/* OTHER PARTY */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
            {roleLabel}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {otherPerson?.image ? (
                <Image
                  src={otherPerson.image}
                  alt={otherPersonName}
                  fill
                  className="object-cover"
                />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {otherPersonName}
              </p>
              {otherPerson?.email && (
                <a
                  href={`mailto:${otherPerson.email}`}
                  className="flex items-center gap-1 truncate text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400"
                >
                  <Mail size={12} /> {otherPerson.email}
                </a>
              )}
            </div>
          </div>

          {lesson.notes && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <StickyNote size={13} /> Notes from booking
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {lesson.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ClassroomStatusProps {
  lesson: Lesson;
  isTeacher: boolean;
  isBooked: boolean;
  isRequest: boolean;
  isReleased: boolean;
  otherPersonName: string;
}

// what the classroom panel says for each lesson state. the live classroom
// itself will be rendered here once it's built
const ClassroomStatus = ({
  lesson,
  isTeacher,
  isBooked,
  isRequest,
  isReleased,
  otherPersonName,
}: ClassroomStatusProps) => {
  const text = "text-sm text-slate-500 dark:text-slate-400";

  if (isBooked) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          The online classroom will open here
        </p>
        <p className={`mt-1 ${text}`}>
          Come back to this page just before your lesson starts.
        </p>
      </div>
    );
  }

  if (isRequest) {
    return (
      <p className={text}>
        {isTeacher
          ? "Accept this request to confirm the lesson and set up the classroom."
          : `Waiting for ${otherPersonName} to accept. The classroom is set up once they do.`}
      </p>
    );
  }

  if (isReleased) {
    const who =
      lesson.status === "Declined"
        ? "Declined by the tutor"
        : `Cancelled by the ${lesson.cancelledBy === "Teacher" ? "tutor" : "student"}`;
    return (
      <div className="space-y-1">
        <p className={text}>This lesson won&apos;t go ahead.</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold">{who}</span>
          {lesson.cancelReason && `: ${lesson.cancelReason}`}
        </p>
      </div>
    );
  }

  return <p className={text}>This lesson has finished.</p>;
};

export default LessonDetailsPage;
