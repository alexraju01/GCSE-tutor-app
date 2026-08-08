"use client";

import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
	"/dashboard/teacher": "Overview",
	"/dashboard/student": "Overview",
	"/dashboard/lessons": "Lessons",
	"/dashboard/schedule": "Schedule",
	"/dashboard/messages": "Messages",
	"/dashboard/settings": "Settings",
};

const Breadcrumb = () => {
	const pathname = usePathname();

	// Find exact match, fallback to formatting the subpath (e.g., /dashboard/lessons/1 -> Lessons)
	const currentSegment = pathname.split("/").filter(Boolean)[1] || "Overview";
	const formattedLabel =
		routeLabels[pathname] || currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);

	return (
		<h1 className='text-sm font-medium text-slate-500 dark:text-slate-400'>
			Dashboard /{" "}
			<span className='font-semibold text-slate-900 dark:text-slate-100'>{formattedLabel}</span>
		</h1>
	);
};

export default Breadcrumb;
