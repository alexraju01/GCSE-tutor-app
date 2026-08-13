import { Clock, DollarSign, Star, Users } from "lucide-react";

interface StatsGridProps {
	dashboardData?: TeacherDashboardData;
}

export const StatsGrid = ({ dashboardData }: StatsGridProps) => {
	const formattedEarnings = dashboardData?.totalEarnings
		? new Intl.NumberFormat("en-GB", {
				style: "currency",
				currency: dashboardData.totalEarnings.currency || "GBP",
			}).format(dashboardData.totalEarnings.amount)
		: "£0.00";

	const stats = [
		{
			label: "Active Students",
			value: String(dashboardData?.activeStudents ?? 0),
			change: "Current active students",
			icon: <Users size={20} className='text-blue-500' />,
		},
		{
			label: "Hours Taught",
			value: `${dashboardData?.totalHoursTaught ?? 0} hrs`,
			change: "Total logged teaching time",
			icon: <Clock size={20} className='text-emerald-500' />,
		},
		{
			label: "Total Earnings",
			value: formattedEarnings,
			change: "Lifetime earnings",
			icon: <DollarSign size={20} className='text-indigo-500' />,
		},
		{
			label: "Completed Lessons",
			value: String(dashboardData?.completedLessons ?? 0),
			change: "Successfully delivered",
			icon: <Star size={20} className='text-amber-500' />,
		},
	];

	return (
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
	);
};
