import { auth } from "@auth";

import {
	ArrowUpRight,
	BookOpen,
	Calendar,
	CheckCircle2,
	Clock,
	GraduationCap,
	Sparkles,
} from "lucide-react";
import Link from "next/link";

const StudentDashboardPage = async () => {
	const session = await auth();
	const userName = session?.user?.name?.split(" ")[0] || "Student";

	const stats = [
		{
			label: "Upcoming Lessons",
			value: "3",
			icon: <Calendar size={20} className='text-blue-500' />,
		},
		{
			label: "Hours Completed",
			value: "14.5 hrs",
			icon: <Clock size={20} className='text-emerald-500' />,
		},
		{
			label: "Active Tutors",
			value: "2 Tutors",
			icon: <GraduationCap size={20} className='text-indigo-500' />,
		},
		{
			label: "Assignments Done",
			value: "12/12",
			icon: <CheckCircle2 size={20} className='text-amber-500' />,
		},
	];

	const upcomingLessons = [
		{
			id: "1",
			subject: "GCSE Higher Mathematics",
			topic: "Quadratic Equations & Calculus Intro",
			tutor: "Dr. Aris Thorne",
			time: "Tomorrow, 4:00 PM - 5:00 PM",
			status: "Confirmed",
		},
		{
			id: "2",
			subject: "GCSE Physics",
			topic: "Electromagnetism & Waves",
			tutor: "Sarah Jenkins",
			time: "Thursday, 5:30 PM - 6:30 PM",
			status: "Confirmed",
		},
	];

	console.log("Student Dashboard Session:", session);
	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			{/* WELCOME BANNER */}
			<div className='relative overflow-hidden rounded-2xl border border-blue-500/20 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 sm:p-8 dark:border-blue-500/30'>
				<div className='relative z-10 max-w-2xl space-y-2'>
					<div className='inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400'>
						<Sparkles size={14} />
						GCSE Exams in 84 Days
					</div>
					<h2 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Welcome back, {userName}!
					</h2>
					<p className='text-sm text-slate-600 dark:text-slate-400'>
						You have 2 upcoming lessons this week. Keep up the consistent pace to reach your target
						grades.
					</p>
				</div>
			</div>

			{/* STATS GRID */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{stats.map((stat, i) => (
					<div
						key={i}
						className='flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all dark:border-slate-800/80 dark:bg-slate-900/50'>
						<div className='space-y-1'>
							<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>{stat.label}</p>
							<p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>{stat.value}</p>
						</div>
						<div className='rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60'>{stat.icon}</div>
					</div>
				))}
			</div>

			<div className='grid gap-8 lg:grid-cols-3'>
				{/* UPCOMING LESSONS (2 COLUMNS) */}
				<div className='space-y-4 lg:col-span-2'>
					<div className='flex items-center justify-between'>
						<h3 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
							Upcoming Lessons
						</h3>
						<Link
							href='/dashboard/schedule'
							className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400'>
							View Schedule <ArrowUpRight size={14} />
						</Link>
					</div>

					<div className='space-y-3'>
						{upcomingLessons.map((lesson) => (
							<div
								key={lesson.id}
								className='flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700 sm:flex-row sm:items-center'>
								<div className='space-y-1'>
									<div className='flex items-center gap-2'>
										<span className='rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
											{lesson.subject}
										</span>
										<span className='text-xs text-slate-400'>•</span>
										<span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
											{lesson.tutor}
										</span>
									</div>
									<h4 className='font-semibold text-slate-900 dark:text-slate-100'>
										{lesson.topic}
									</h4>
									<p className='flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
										<Clock size={14} /> {lesson.time}
									</p>
								</div>

								<Link
									href={`/dashboard/lessons/${lesson.id}`}
									className='inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.98]'>
									Join Classroom
								</Link>
							</div>
						))}
					</div>
				</div>
				{/* QUICK ACTIONS SIDEBAR (1 COLUMN) */}
				<div className='space-y-4'>
					<h3 className='text-lg font-bold text-slate-900 dark:text-slate-100'>Quick Actions</h3>

					<div className='space-y-3'>
						<Link
							href='/teachers'
							className='group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-blue-500/50 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50'>
							<div className='flex items-center gap-3'>
								<div className='rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400'>
									<GraduationCap size={20} />
								</div>
								<div>
									<h4 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
										Book a Tutor
									</h4>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Find 1-on-1 GCSE experts
									</p>
								</div>
							</div>
							<ArrowUpRight
								size={18}
								className='text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
							/>
						</Link>

						<Link
							href='/dashboard/lessons'
							className='group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-blue-500/50 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50'>
							<div className='flex items-center gap-3'>
								<div className='rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400'>
									<BookOpen size={20} />
								</div>
								<div>
									<h4 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
										Study Materials
									</h4>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Access past notes & canvases
									</p>
								</div>
							</div>
							<ArrowUpRight
								size={18}
								className='text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
							/>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudentDashboardPage;
