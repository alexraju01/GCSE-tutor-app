import { auth } from "@auth";

import { Calendar, Sparkles, CheckCircle2, Clock, GraduationCap } from "lucide-react";

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
		</div>
	);
};

export default StudentDashboardPage;
