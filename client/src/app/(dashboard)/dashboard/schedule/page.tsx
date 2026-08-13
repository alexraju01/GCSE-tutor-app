import { auth } from "@auth";
import ScheduleHeader from "@components/dashboard/calendar/ScheduleHeader";
import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	GraduationCap,
	Video,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { api } from "@utils/api";

interface Student {
	id?: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
}

interface Tutor {
	id?: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
}

interface BookingAPIItem {
	id: string;
	subject: string;
	topic: string;
	meetingRoomId: string | null;
	startTime: string;
	duration: number;
	status: string;
	notes?: string;
	student?: Student;
	tutor?: Tutor;
}

interface Session {
	id: string;
	title: string;
	subject: string;
	tutorOrStudent: string;
	roleLabel: string;
	date: string;
	time: string;
	duration: string;
	status: "Upcoming" | "Completed" | "Cancelled";
	meetingUrl?: Route<string>;
}

// Utility function to map API statuses to UI component statuses
const mapStatus = (status: string): "Upcoming" | "Completed" | "Cancelled" => {
	switch (status.toUpperCase()) {
		case "CONFIRMED":
		case "UPCOMING":
		case "SCHEDULED":
			return "Upcoming";
		case "COMPLETED":
			return "Completed";
		case "CANCELLED":
		case "CANCELED":
			return "Cancelled";
		default:
			return "Upcoming";
	}
};

const SchedulePage = async () => {
	const session = await auth();
	const isTeacher = session?.user?.role === "Teacher";

	const token = session?.backendToken ?? "";
	const lessonsAPI = await api.lessons.getAll(token);

	// Transform API bookings to match UI structure
	const bookings: BookingAPIItem[] = lessonsAPI?.bookings ?? [];

	const scheduleItems: Session[] = bookings.map((item) => {
		const startDate = new Date(item.startTime);
		const endDate = new Date(startDate.getTime() + item.duration * 60000);

		const mappedStatus = mapStatus(item.status);

		// Format date (e.g., "Aug 14, 2026")
		const formattedDate = startDate.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

		// Format times (e.g., "5:00 PM - 6:00 PM")
		const startTimeStr = startDate.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
		const endTimeStr = endDate.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});

		// Resolve Person Name
		const targetPerson = isTeacher ? item.student : item.tutor;
		const personName =
			targetPerson?.name ||
			[targetPerson?.firstName, targetPerson?.lastName].filter(Boolean).join(" ") ||
			"Unknown";

		// Format subject (e.g., "MATHEMATICS" -> "Mathematics")
		const formattedSubject =
			item.subject.charAt(0).toUpperCase() + item.subject.slice(1).toLowerCase();

		return {
			id: item.id,
			title: item.topic,
			subject: formattedSubject,
			tutorOrStudent: personName,
			roleLabel: isTeacher ? "Student" : "Tutor",
			date: formattedDate,
			time: `${startTimeStr} - ${endTimeStr}`,
			duration: `${item.duration} mins`,
			status: mappedStatus,
			meetingUrl:
				mappedStatus === "Upcoming"
					? (`/dashboard/lessons/${item.id}` as Route)
					: undefined,
		};
	});

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			{/* PAGE HEADER */}
			<ScheduleHeader isTeacher={isTeacher} />

			{/* FILTER & DATE CONTROLS BAR */}
			<div className='flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between'>
				{/* Date Navigator */}
				<div className='flex items-center gap-2'>
					<button
						aria-label='Previous week'
						className='rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						<ChevronLeft size={16} />
					</button>
					<div className='flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200'>
						<CalendarIcon size={14} className='text-blue-500' />
						<span>August 2026</span>
					</div>
					<button
						aria-label='Next week'
						className='rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						<ChevronRight size={16} />
					</button>
				</div>

				{/* Status Filters */}
				<div className='flex items-center gap-2 overflow-x-auto text-xs font-medium'>
					<span className='flex items-center gap-1 text-slate-400 pr-2'>
						<Filter size={14} /> Filter:
					</span>
					<button className='rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white'>
						All
					</button>
					<button className='rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						Upcoming
					</button>
					<button className='rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						Completed
					</button>
				</div>
			</div>

			{/* SCHEDULE LIST */}
			<div className='space-y-4'>
				{scheduleItems.length === 0 ? (
					<p className='py-8 text-center text-sm text-slate-500 dark:text-slate-400'>
						No scheduled lessons found.
					</p>
				) : (
					scheduleItems.map((item) => {
						const isUpcoming = item.status === "Upcoming";

						return (
							<div
								key={item.id}
								className='flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700 md:flex-row md:items-center'>
								{/* Left Column: Time & Status */}
								<div className='flex items-start gap-4 md:w-1/3'>
									<div className='flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400'>
										<Clock size={20} />
									</div>
									<div>
										<p className='text-sm font-bold text-slate-900 dark:text-slate-100'>
											{item.date}
										</p>
										<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
											{item.time} ({item.duration})
										</p>
										<span
											className={`mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
												isUpcoming
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "bg-slate-500/10 text-slate-600 dark:text-slate-400"
											}`}>
											{item.status}
										</span>
									</div>
								</div>

								{/* Middle Column: Topic & Tutor/Student Info */}
								<div className='space-y-1 md:w-1/3'>
									<div className='flex items-center gap-2'>
										<span className='rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
											{item.subject}
										</span>
									</div>
									<h3 className='font-semibold text-slate-900 dark:text-slate-100'>
										{item.title}
									</h3>
									<p className='flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
										<GraduationCap size={14} />
										<span>
											{item.roleLabel}:{" "}
											<strong className='text-slate-700 dark:text-slate-300'>
												{item.tutorOrStudent}
											</strong>
										</span>
									</p>
								</div>

								{/* Right Column: Actions */}
								<div className='flex items-center justify-end gap-3 md:w-1/3'>
									{isUpcoming && item.meetingUrl ? (
										<Link
											href={item.meetingUrl}
											className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]'>
											<Video size={14} />
											Enter Classroom
										</Link>
									) : (
										<button
											disabled={!isUpcoming}
											className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
											{isUpcoming ? "Reschedule" : "View Notes"}
										</button>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default SchedulePage;