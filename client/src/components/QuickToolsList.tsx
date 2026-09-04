import Link from "next/link";
import type { Route } from "next";
import { Compass, Video, BookOpen } from "lucide-react";

interface QuickToolItem {
	label: string;
	href: Route;
	icon: React.ReactNode;
}

const quickTools: QuickToolItem[] = [
	{
		label: "Browse Tutors",
		href: "/tutors" as Route,
		icon: <Compass size={15} className='text-slate-400' />,
	},
	{
		label: "Open Collaborative Canvas",
		href: "/dashboard/canvas" as Route,
		icon: <Video size={15} className='text-slate-400' />,
	},
	{
		label: "My Learning Material",
		href: "/dashboard/lessons" as Route,
		icon: <BookOpen size={15} className='text-slate-400' />,
	},
];

const QuickToolsList = () => {
	return (
		<div className='mt-3 space-y-2'>
			{quickTools.map((tool) => (
				<Link
					key={tool.href}
					href={tool.href}
					className='flex w-full items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800/80'>
					{tool.icon}
					<span>{tool.label}</span>
				</Link>
			))}
		</div>
	);
};

export default QuickToolsList;
