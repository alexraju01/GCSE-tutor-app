import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, Info, Video } from "lucide-react";
import { formatScheduleDate, formatTimeRange } from "@utils/date";
import StatusBadge from "@components/dashboard/StatusBadge";
import AddToCalendarButton from "./AddToCalendarButton";
import CancelLessonButton from "./CancelLessonButton";
import LessonRequestActions from "./LessonRequestActions";

interface ScheduleItemCardProps {
	lesson: Lesson;
	isTeacher: boolean;
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const ScheduleItemCard = ({ lesson, isTeacher }: ScheduleItemCardProps) => {
	const { startDate, formattedDate } = formatScheduleDate(lesson.startTime);
	const timeRange = formatTimeRange(startDate, lesson.duration);
	const subject = lesson.subject.replace(/_/g, " ");

	const isBooked = lesson.status === "Upcoming" || lesson.status === "Confirmed";
	const isRequest = lesson.status === "Pending";
	const isLive = isBooked || isRequest;
	const isReleased = lesson.status === "Cancelled" || lesson.status === "Declined";

	const targetPerson = isTeacher ? lesson.student : lesson.teacher;
	const personName = targetPerson?.name || "Unknown";
	const personImage = targetPerson?.image;
	const roleLabel = isTeacher ? "Student" : "Tutor";
	const meetingUrl = isBooked ? (`/dashboard/lessons/${lesson.id}` as Route) : undefined;
	const lessonLabel = `${subject} · ${formattedDate}, ${timeRange} (UK)`;

	// too close to the start to cancel - show a hint instead of just hiding the button
	const cancelBlocked = isLive && !lesson.canCancel && startDate > new Date();

	const initials = personName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();

	return (
		<div className='flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 md:flex-row md:items-center'>
			{/* Time & Status Column */}
			<div className='flex items-start gap-4 md:w-1/3'>
				<div className='flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400'>
					<Clock size={20} />
				</div>
				<div>
					<p className='text-sm font-bold text-slate-900 dark:text-slate-100'>{formattedDate}</p>
					<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
						{timeRange} ({lesson.duration} mins)
						{lesson.priceAtBooking !== null && ` · ${gbp.format(lesson.priceAtBooking)}`}
					</p>
					<StatusBadge status={lesson.status} className='mt-2' />
				</div>
			</div>

			{/* Participant Avatar & Subject Details Column */}
			<div className='flex items-center gap-3.5 md:w-1/3'>
				{personImage ? (
					<Image
						src={personImage}
						alt={personName}
						width={40}
						height={40}
						className='h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800'
					/>
				) : (
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'>
						{initials}
					</div>
				)}
				<div className='min-w-0 space-y-0.5'>
					<span className='inline-block rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400'>
						{subject}
					</span>
					<h3 className='truncate font-semibold text-slate-900 dark:text-slate-100'>
						{lesson.topic || "General session"}
					</h3>
					<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
						{roleLabel}:{" "}
						<strong className='font-semibold text-slate-700 dark:text-slate-300'>
							{personName}
						</strong>
					</p>
					{isReleased && lesson.cancelReason && (
						<p className='line-clamp-2 text-xs text-slate-500 dark:text-slate-400'>
							<span className='font-semibold'>
								{lesson.status === "Declined"
									? "Tutor's note"
									: `Cancelled by ${lesson.cancelledBy === "Teacher" ? "tutor" : "student"}`}
								:
							</span>{" "}
							{lesson.cancelReason}
						</p>
					)}
				</div>
			</div>

			{/* Actions Column */}
			<div className='flex flex-col items-end gap-2 md:w-1/3'>
				{isTeacher && isRequest && startDate > new Date() && (
					<LessonRequestActions lessonId={lesson.id} lessonLabel={lessonLabel} />
				)}

				{!isTeacher && isRequest && (
					<p className='text-right text-xs text-amber-700 dark:text-amber-400'>
						Waiting for {personName} to accept.
					</p>
				)}

				{isBooked && meetingUrl && (
					<Link
						href={meetingUrl}
						className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'>
						<Video size={14} /> Enter Classroom
					</Link>
				)}

				{isLive && (
					<div className='flex flex-wrap items-center justify-end gap-2'>
						{isBooked && (
							<AddToCalendarButton
								events={[
									{
										id: lesson.id,
										title: `${subject} lesson with ${personName}`,
										start: startDate,
										durationMinutes: lesson.duration,
										description: lesson.topic ?? undefined,
									},
								]}
								filename={`lesson-${lesson.id}.ics`}
							/>
						)}
						{lesson.canCancel && (
							<CancelLessonButton
								lessonId={lesson.id}
								isTeacher={isTeacher}
								isRequest={isRequest}
								lessonLabel={lessonLabel}
							/>
						)}
					</div>
				)}

				{cancelBlocked && !isTeacher && (
					<p className='flex items-center gap-1 text-right text-[11px] text-slate-400'>
						<Info size={12} /> Within {lesson.cancellationCutoffHours}h of the start — message your tutor to change it.
					</p>
				)}
			</div>
		</div>
	);
};

export default ScheduleItemCard;
