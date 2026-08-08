import { auth } from "@auth";
import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	GraduationCap,
	Plus,
	Video,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

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

const SchedulePage = async () => {
	const session = await auth();
	const isTeacher = session?.user?.role === "Teacher";

	// Mock schedule data (replace with database queries)
	const scheduleItems: Session[] = [
		{
			id: "1",
			title: "Quadratic Equations & Calculus Intro",
			subject: "GCSE Mathematics",
			tutorOrStudent: isTeacher ? "Alex Morgan" : "Dr. Aris Thorne",
			roleLabel: isTeacher ? "Student" : "Tutor",
			date: "Today, Aug 8",
			time: "4:00 PM - 5:00 PM",
			duration: "60 mins",
			status: "Upcoming",
			meetingUrl: "/dashboard/lessons/1" as Route,
		},
		{
			id: "2",
			title: "Electromagnetism & Wave Phenomena",
			subject: "GCSE Physics",
			tutorOrStudent: isTeacher ? "Liam Davies" : "Sarah Jenkins",
			roleLabel: isTeacher ? "Student" : "Tutor",
			date: "Tomorrow, Aug 9",
			time: "5:30 PM - 6:30 PM",
			duration: "60 mins",
			status: "Upcoming",
			meetingUrl: "/dashboard/lessons/2" as Route,
		},
		{
			id: "3",
			title: "Organic Chemistry Foundations",
			subject: "GCSE Chemistry",
			tutorOrStudent: isTeacher ? "Emma Watson" : "Prof. Michael Faraday",
			roleLabel: isTeacher ? "Student" : "Tutor",
			date: "Mon, Aug 11",
			time: "2:00 PM - 3:00 PM",
			duration: "60 mins",
			status: "Upcoming",
			meetingUrl: "/dashboard/lessons/3" as Route,
		},
		{
			id: "4",
			title: "Cellular Biology & Genetics",
			subject: "GCSE Biology",
			tutorOrStudent: isTeacher ? "Sophia Lin" : "Dr. Rosalind Franklin",
			roleLabel: isTeacher ? "Student" : "Tutor",
			date: "Wed, Aug 6",
			time: "3:00 PM - 4:00 PM",
			duration: "60 mins",
			status: "Completed",
		},
	];

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			{/* PAGE HEADER */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Schedule & Bookings
					</h1>
					<p className='text-sm text-slate-500 dark:text-slate-400'>
						Manage your upcoming live tutoring sessions and past lessons.
					</p>
				</div>

				<div className='flex items-center gap-3'>
					{isTeacher ? (
						<button className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.98]'>
							<Plus size={16} />
							Set Availability
						</button>
					) : (
						<Link
							href='/teachers'
							className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.98]'>
							<Plus size={16} />
							Book New Lesson
						</Link>
					)}
				</div>
			</div>

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
				{scheduleItems.map((item) => {
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
								<h3 className='font-semibold text-slate-900 dark:text-slate-100'>{item.title}</h3>
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
				})}
			</div>
		</div>
	);
};

export default SchedulePage;
