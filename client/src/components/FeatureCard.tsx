interface FeatureCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	className?: string;
	themeColor: "blue" | "indigo" | "purple";
}

export default function FeatureCard({
	icon,
	title,
	description,
	className = "",
	themeColor,
}: FeatureCardProps) {
	// Maps color variants nicely to keep classes legible
	const themeMap = {
		blue: {
			hoverBorder: "hover:border-blue-500/40 dark:hover:border-blue-500/30",
			hoverShadow: "dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.05)]",
			bgGlow: "bg-blue-500/3 dark:bg-blue-500/5 group-hover:bg-blue-500/10",
			iconBg:
				"bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
			iconHoverBg: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
			textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
		},
		indigo: {
			hoverBorder: "hover:border-indigo-500/40 dark:hover:border-indigo-500/30",
			hoverShadow: "dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.05)]",
			bgGlow: "bg-indigo-500/3 dark:bg-indigo-500/5 group-hover:bg-indigo-500/10",
			iconBg:
				"bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-400",
			iconHoverBg: "group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600",
			textHover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
		},
		purple: {
			hoverBorder: "hover:border-purple-500/40 dark:hover:border-purple-500/30",
			hoverShadow: "dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.05)]",
			bgGlow: "bg-purple-500/3 dark:bg-purple-500/5 group-hover:bg-purple-500/10",
			iconBg:
				"bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 text-purple-400",
			iconHoverBg: "group-hover:bg-purple-600 dark:group-hover:bg-purple-600",
			textHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
		},
	};

	const theme = themeMap[themeColor];

	return (
		<div
			className={`relative rounded-3xl bg-white dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] border border-slate-200 dark:border-slate-800/80 p-8 flex flex-col justify-between overflow-hidden group hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)] transition-all duration-500 cursor-pointer ${theme.hoverBorder} ${theme.hoverShadow} ${className}`}>
			<div
				className={`absolute -right-10 -bottom-10 size-44 rounded-full filter blur-2xl transition-colors duration-500 ${theme.bgGlow}`}
			/>

			<div
				className={`size-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 group-hover:text-white transition-all duration-500 ease-out ${theme.iconBg} ${theme.iconHoverBg}`}>
				{icon}
			</div>

			<div className='relative z-10 max-w-md'>
				<h3
					className={`text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors duration-300 ${theme.textHover}`}>
					{title}
				</h3>
				<p className='text-slate-600 dark:text-slate-400 text-sm leading-relaxed'>{description}</p>
			</div>
		</div>
	);
}
