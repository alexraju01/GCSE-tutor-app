import { auth } from "@auth";
import {
	ArrowUpRight,
	// BookOpen,
	// Calendar,
	// CheckCircle2,
	Clock,
	DollarSign,
	// GraduationCap,
	Sparkles,
	Star,
	Users,
	Video,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

const TeacherDashboardPage = async () => {
	const session = await auth();
	const teacherName = session?.user?.name || "Teacher";

	const stats = [
		{
			label: "Active Students",
			value: "18",
			change: "+3 this month",
			icon: <Users size={20} className='text-blue-500' />,
		},
		{
			label: "Hours Taught",
			value: "42.5 hrs",
			change: "12 hrs this week",
			icon: <Clock size={20} className='text-emerald-500' />,
		},
		{
			label: "Total Earnings",
			value: "£1,480",
			change: "Pending payout: £320",
			icon: <DollarSign size={20} className='text-indigo-500' />,
		},
		{
			label: "Average Rating",
			value: "4.95 / 5",
			change: "34 Reviews",
			icon: <Star size={20} className='text-amber-500' />,
		},
	];

	const upcomingSessions = [
		{
			id: "1",
			subject: "GCSE Higher Mathematics",
			topic: "Quadratic Equations & Calculus Intro",
			student: "Alex Morgan",
			time: "Today, 4:00 PM - 5:00 PM",
			status: "Upcoming",
		},
		{
			id: "2",
			subject: "GCSE Physics",
			topic: "Electromagnetism & Waves",
			student: "Liam Davies",
			time: "Tomorrow, 5:30 PM - 6:30 PM",
			status: "Upcoming",
		},
	];

	const pendingRequests = [
		{
			id: "req-1",
			student: "Emma Watson",
			subject: "GCSE Chemistry",
			requestedTime: "Fri, Aug 12 • 3:00 PM",
		},
		{
			id: "req-2",
			student: "Sophia Lin",
			subject: "GCSE Biology",
			requestedTime: "Sat, Aug 13 • 11:00 AM",
		},
	];

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			{/* WELCOME BANNER */}
			<div className='relative overflow-hidden rounded-2xl border border-blue-500/20 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 sm:p-8 dark:border-blue-500/30'>
				<div className='relative z-10 max-w-2xl space-y-2'>
					<div className='inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400'>
						<Sparkles size={14} />
						Teacher Workspace
					</div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Welcome back, {teacherName}!
					</h1>
					<p className='text-sm text-slate-600 dark:text-slate-400'>
						You have 2 scheduled sessions today and 2 new lesson requests awaiting confirmation.
					</p>
				</div>
			</div>

			{/* STATS GRID */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{stats.map((stat, i) => (
					<div
						key={i}
						className='flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all dark:border-slate-800/80 dark:bg-slate-900/50'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
								{stat.label}
							</span>
							<div className='rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60'>{stat.icon}</div>
						</div>
						<div className='mt-3'>
							<p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>{stat.value}</p>
							<p className='mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400'>
								{stat.change}
							</p>
						</div>
					</div>
				))}
			</div>

			{/* MAIN CONTENT GRID */}
			<div className='grid gap-8 lg:grid-cols-3'>
				{/* UPCOMING SESSIONS (2 COLUMNS) */}
				<div className='space-y-4 lg:col-span-2'>
					<div className='flex items-center justify-between'>
						<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
							Today&apos;s Teaching Schedule
						</h2>
						<Link
							href={"/dashboard/schedule" as Route}
							className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400'>
							Full Calendar <ArrowUpRight size={14} />
						</Link>
					</div>

					<div className='space-y-3'>
						{upcomingSessions.map((sessionItem) => (
							<div
								key={sessionItem.id}
								className='flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700 sm:flex-row sm:items-center'>
								<div className='space-y-1'>
									<div className='flex items-center gap-2'>
										<span className='rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
											{sessionItem.subject}
										</span>
										<span className='text-xs text-slate-400'>•</span>
										<span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
											Student:{" "}
											<strong className='text-slate-700 dark:text-slate-200'>
												{sessionItem.student}
											</strong>
										</span>
									</div>
									<h3 className='font-semibold text-slate-900 dark:text-slate-100'>
										{sessionItem.topic}
									</h3>
									<p className='flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
										<Clock size={14} /> {sessionItem.time}
									</p>
								</div>

								<Link
									href={`/dashboard/lessons/${sessionItem.id}` as Route}
									className='inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.98]'>
									<Video size={14} /> Launch Classroom
								</Link>
							</div>
						))}
					</div>
				</div>

				{/* PENDING BOOKING REQUESTS (1 COLUMN) */}
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
							Booking Requests
						</h2>
						<span className='rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
							{pendingRequests.length} Pending
						</span>
					</div>

					<div className='space-y-3'>
						{pendingRequests.map((req) => (
							<div
								key={req.id}
								className='space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
								<div className='flex items-start justify-between'>
									<div>
										<h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
											{req.student}
										</h3>
										<p className='text-xs font-medium text-blue-600 dark:text-blue-400'>
											{req.subject}
										</p>
									</div>
									<span className='text-[10px] text-slate-400'>{req.requestedTime}</span>
								</div>

								<div className='flex items-center gap-2 pt-1'>
									<button className='flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500'>
										Accept
									</button>
									<button className='flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
										Decline
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
export default TeacherDashboardPage;
