import Link from "next/link";
import {
	BookOpen,
	Calendar,
	Clock,
	Video,
	UserCheck,
	CheckCircle,
	Plus,
	Compass,
} from "lucide-react";

import { auth } from "@auth";
import { redirect } from "next/navigation";
import type { Route } from "next";
import QuickToolsList from "@components/QuickToolsList";

const StudentDashboardPage = async () => {
	const session = await auth();

	if (!session?.user) {
		redirect("/sign-up");
	}

	const { user } = session;

	// Placeholder data matching layout structure
	const activeTutorsCount = 2;
	const learningHours = 14;
	const completedLessons = 12;
	const assignmentsDue = 1;

	const todaySchedule = [
		{
			id: "1",
			subject: "GCSE English Literature",
			tutorName: "Lydia Heathcote",
			tutorAvatar:
				"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
			title: "Upgradable composite emulation",
			time: "Thu, Sep 3, 4:00 PM - 5:00 PM",
		},
		{
			id: "2",
			subject: "A-Level Biology",
			tutorName: "Keith Sporer-Leffler",
			tutorAvatar:
				"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
			title: "Team-oriented needs-based emulation",
			time: "Thu, Sep 3, 5:00 PM - 6:00 PM",
		},
		{
			id: "3",
			subject: "GCSE English Literature",
			tutorName: "Maiya Dooley",
			tutorAvatar:
				"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
			title: "Diverse incremental matrix",
			time: "Sat, Sep 5, 8:00 PM - 9:00 PM",
		},
	];

	return (
		<div className='space-y-8'>
			{/* WELCOME BANNER */}
			<section className='relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white p-6 dark:border-blue-900/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent'>
				<div className='flex flex-wrap items-center gap-2 mb-3'>
					<span className='inline-flex items-center gap-1.5 rounded-md bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'>
						<UserCheck size={14} />
						Student Workspace
					</span>
					<span className='rounded-md border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'>
						GCSE English Literature
					</span>
					<span className='rounded-md border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'>
						A-LEVEL Biology
					</span>
				</div>

				<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl'>
					Welcome back, {user.name || "Student"}!
				</h1>
				<p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
					You have 3 scheduled sessions upcoming and 1 assignment awaiting completion.
				</p>
			</section>

			{/* METRICS GRID */}
			<section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{/* Active Tutors */}
				<div className='rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>
							Active Tutors
						</span>
						<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'>
							<UserCheck size={16} />
						</div>
					</div>
					<p className='mt-3 text-3xl font-bold text-slate-900 dark:text-white'>
						{activeTutorsCount}
					</p>
					<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Current active tutors</p>
				</div>

				{/* Learning Hours */}
				<div className='rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>
							Learning Hours
						</span>
						<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'>
							<Clock size={16} />
						</div>
					</div>
					<p className='mt-3 text-3xl font-bold text-slate-900 dark:text-white'>
						{learningHours} hrs
					</p>
					<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Total logged study time</p>
				</div>

				{/* Completed Lessons */}
				<div className='rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>
							Completed Lessons
						</span>
						<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'>
							<CheckCircle size={16} />
						</div>
					</div>
					<p className='mt-3 text-3xl font-bold text-slate-900 dark:text-white'>
						{completedLessons}
					</p>
					<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Successfully attended</p>
				</div>

				{/* Assignments Due */}
				<div className='rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>
							Assignments Due
						</span>
						<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'>
							<BookOpen size={16} />
						</div>
					</div>
					<p className='mt-3 text-3xl font-bold text-slate-900 dark:text-white'>{assignmentsDue}</p>
					<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Pending completion</p>
				</div>
			</section>

			{/* TWO-COLUMN CONTENT AREA */}
			<div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
				{/* SCHEDULE COLUMN (2/3) */}
				<div className='space-y-4 lg:col-span-2'>
					<div className='flex items-center justify-between'>
						<h2 className='text-base font-bold text-slate-900 dark:text-white'>
							Today's Learning Schedule
						</h2>
						<Link
							href='/dashboard/schedule'
							className='text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'>
							Full Calendar &rarr;
						</Link>
					</div>

					<div className='space-y-3'>
						{todaySchedule.map((sessionItem) => (
							<div
								key={sessionItem.id}
								className='flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex items-start gap-3.5'>
									<img
										src={sessionItem.tutorAvatar}
										alt={sessionItem.tutorName}
										className='h-10 w-10 shrink-0 rounded-full object-cover'
									/>
									<div>
										<div className='flex flex-wrap items-center gap-2'>
											<span className='rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'>
												{sessionItem.subject}
											</span>
											<span className='text-xs text-slate-500 dark:text-slate-400'>
												Tutor:{" "}
												<strong className='font-semibold text-slate-700 dark:text-slate-300'>
													{sessionItem.tutorName}
												</strong>
											</span>
										</div>
										<h3 className='mt-1 text-sm font-semibold text-slate-900 dark:text-white'>
											{sessionItem.title}
										</h3>
										<p className='mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
											<Clock size={13} />
											{sessionItem.time}
										</p>
									</div>
								</div>

								<Link
									href={`/classroom/${sessionItem.id}` as Route}
									className='inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'>
									<Video size={14} />
									<span>Launch Classroom</span>
								</Link>
							</div>
						))}
					</div>
				</div>

				{/* SIDEBAR WIDGETS COLUMN (1/3) */}
				<div className='space-y-6'>
					{/* BOOK NEW LESSON WIDGET */}
					<div className='rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white'>
								<Calendar size={16} className='text-blue-600 dark:text-blue-400' />
								<span>Book a Session</span>
							</div>
						</div>
						<p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>
							Find qualified GCSE tutors and schedule 1-on-1 live sessions.
						</p>
						<Link
							href='/tutors'
							className='mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'>
							<Plus size={14} />
							<span>Find & Book Tutor</span>
						</Link>
					</div>

					{/* QUICK TOOLS */}
					<div className='rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'>
						<p className='text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>
							Quick Tools
						</p>
						<QuickToolsList />
					</div>
				</div>
			</div>
		</div>
	);
};
export default StudentDashboardPage;
