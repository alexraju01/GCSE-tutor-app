// WelcomeBanner.tsx
import { formatString } from "@utils/stringFormat";
import { GraduationCap, Sparkles, Zap } from "lucide-react";

export interface Subject {
	id: string | number;
	level?: string;
	subject?: string;
}

export interface WelcomeBannerProps {
	userName: string;
	role: "Teacher" | "Student";
	upcomingCount?: number;
	pendingCount?: number;
	subjects?: Subject[];
	level?: number;
	currentXp?: number;
	xpForNextLevel?: number;
}

const BASE_STYLES = {
	containerClasses:
		"border-blue-500/20 bg-linear-to-r from-blue-600/10 via-indigo-600/10 to-transparent sm:p-8",
	badgeClasses: "rounded-full border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
	chipClasses:
		"rounded-full border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300",
};

// Helper to determine rank tier based on student level
const getRankTitle = (level: number) => {
	if (level >= 10) return "Master Scholar";
	if (level >= 7) return "Gold Scholar";
	if (level >= 4) return "Silver Scholar";
	return "Bronze Scholar";
};

const WelcomeBanner = ({
	userName,
	role,
	upcomingCount = 0,
	pendingCount = 0,
	subjects = [],
	level = 1,
	currentXp = 0,
	xpForNextLevel = 100,
}: WelcomeBannerProps) => {
	const isTeacher = role === "Teacher";
	const RoleIcon = isTeacher ? Sparkles : GraduationCap;
	const roleLabel = isTeacher ? "Teacher Workspace" : "Student Workspace";

	const pendingText = isTeacher
		? `and ${pendingCount} new lesson ${pendingCount === 1 ? "request" : "requests"}`
		: `and ${pendingCount} ${pendingCount === 1 ? "assignment" : "assignments"} awaiting completion.`;

	// Circular progress calculations
	const radius = 26;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.min(Math.max(currentXp / xpForNextLevel, 0), 1);
	const strokeDashoffset = circumference - progress * circumference;

	const rankTitle = getRankTitle(level);

	return (
		<section
			className={`relative overflow-hidden rounded-2xl border p-6 dark:border-blue-500/30 ${BASE_STYLES.containerClasses}`}>
			<div className='flex flex-col-reverse justify-between gap-6 sm:flex-row sm:items-center'>
				{/* Main Text Content */}
				<div className='relative z-10 max-w-xl space-y-2.5'>
					<div className='mb-1 flex flex-wrap items-center gap-2'>
						<div
							className={`inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold ${BASE_STYLES.badgeClasses}`}>
							<RoleIcon size={14} />
							{roleLabel}
						</div>

						{subjects.map(({ id, level: subLevel, subject }) => {
							const label = [formatString(subLevel), formatString(subject)]
								.filter(Boolean)
								.join(" ");

							return (
								<span
									key={id}
									className={`border px-2.5 py-0.5 text-xs font-medium text-slate-700 ${BASE_STYLES.chipClasses}`}>
									{label}
								</span>
							);
						})}
					</div>

					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Welcome back, {userName || (isTeacher ? "Teacher" : "Student")}!
					</h1>

					<p className='text-sm text-slate-600 dark:text-slate-400'>
						You have {upcomingCount} scheduled {upcomingCount === 1 ? "lesson" : "lessons"} upcoming{" "}
						{pendingText}
					</p>
				</div>

				{/* Gamified Level & XP Status Card (Students Only) */}
				{!isTeacher && (
					<div className='relative flex shrink-0 items-center gap-4 self-start rounded-xl border border-slate-200/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/50 sm:self-center'>
						{/* Circular Level Ring */}
						<div className='relative flex h-16 w-16 items-center justify-center'>
							<svg className='h-full w-full -rotate-90 transform'>
								{/* Background Ring */}
								<circle
									cx='32'
									cy='32'
									r={radius}
									className='stroke-blue-500/15 dark:stroke-blue-500/25'
									strokeWidth='5'
									fill='transparent'
								/>
								{/* Progress Ring */}
								<circle
									cx='32'
									cy='32'
									r={radius}
									className='stroke-blue-600 transition-all duration-500 ease-out dark:stroke-blue-400'
									strokeWidth='5'
									strokeDasharray={circumference}
									strokeDashoffset={strokeDashoffset}
									strokeLinecap='round'
									fill='transparent'
								/>
							</svg>
							<div className='absolute flex flex-col items-center justify-center text-center'>
								<span className='text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500'>
									LVL
								</span>
								<span className='text-base font-extrabold leading-none text-slate-900 dark:text-slate-100'>
									{level}
								</span>
							</div>
						</div>

						{/* XP & Rank Meta Details */}
						<div className='flex flex-col justify-center pr-1'>
							<span className='text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400'>
								{rankTitle}
							</span>

							<div className='mt-0.5 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400'>
								<Zap size={13} className='fill-blue-600 dark:fill-blue-400' />
								<span>
									{currentXp} / {xpForNextLevel} XP
								</span>
							</div>

							<span className='mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400'>
								{xpForNextLevel - currentXp} XP to Level {level + 1}
							</span>
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

export default WelcomeBanner;
