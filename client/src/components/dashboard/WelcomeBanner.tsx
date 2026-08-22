import { formatString } from "@utils/stringFormat";
import { Sparkles } from "lucide-react";

export interface Subject {
	id: string | number;
	subject: string;
	level?: string;
}

interface WelcomeBannerProps {
	teacherName: string;
	upcomingCount?: number;
	pendingCount?: number;
	teaches?: Subject[];
}

export const WelcomeBanner = ({
	teacherName,
	upcomingCount = 0,
	pendingCount = 0,
	teaches = [],
}: WelcomeBannerProps) => {
	return (
		<div className='relative overflow-hidden rounded-2xl border border-blue-500/20 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 sm:p-8 dark:border-blue-500/30'>
			<div className='relative z-10 max-w-2xl space-y-2.5'>
				<div className='flex flex-wrap items-center gap-2'>
					<div className='inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400'>
						<Sparkles size={14} />
						Teacher Workspace
					</div>

					{teaches.map((item) => {
						const formattedLevel = formatString(item.level);
						const label = formattedLevel ? `${formattedLevel} ${item.subject}` : item.subject;

						return (
							<span
								key={item.id}
								className='rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300'>
								{label}
							</span>
						);
					})}
				</div>
				<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
					Welcome back, {teacherName}!
				</h1>
				<p className='text-sm text-slate-600 dark:text-slate-400'>
					You have {upcomingCount} scheduled {upcomingCount === 1 ? "session" : "sessions"} upcoming
					and {pendingCount} new lesson {pendingCount === 1 ? "request" : "requests"} awaiting
					confirmation.
				</p>
			</div>
		</div>
	);
};
