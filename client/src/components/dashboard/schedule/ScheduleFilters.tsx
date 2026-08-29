import Link from "next/link";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { Route } from "next";

// type FilterType = "all" | "upcoming" | "completed";

interface ScheduleFiltersProps {
	activeFilter: StatusType;
	selectedYear: number;
	selectedMonth?: number;
	formattedDateHeader: string;
}

const ScheduleFilters = ({
	activeFilter,
	selectedYear,
	selectedMonth,
	formattedDateHeader,
}: ScheduleFiltersProps) => {
	const isMonthlyView = selectedMonth !== undefined;

	const buildUrl = (newFilter: StatusType, year = selectedYear, month = selectedMonth) => {
		const params = new URLSearchParams();
		if (month !== undefined) params.set("month", String(month + 1));
		params.set("year", String(year));
		params.set("filter", newFilter);
		params.set("page", "1");
		return `/dashboard/schedule?${params.toString()}` as Route;
	};

	const prevUrl = isMonthlyView
		? buildUrl(
				activeFilter,
				selectedMonth === 0 ? selectedYear - 1 : selectedYear,
				(selectedMonth + 11) % 12,
			)
		: buildUrl(activeFilter, selectedYear - 1);

	const nextUrl = isMonthlyView
		? buildUrl(
				activeFilter,
				selectedMonth === 11 ? selectedYear + 1 : selectedYear,
				(selectedMonth + 1) % 12,
			)
		: buildUrl(activeFilter, selectedYear + 1);

	const toggleViewUrl = (
		isMonthlyView
			? `/dashboard/schedule?year=${selectedYear}&filter=${activeFilter}&page=1`
			: `/dashboard/schedule?month=${new Date().getMonth() + 1}&year=${selectedYear}&filter=${activeFilter}&page=1`
	) as Route;

	const getFilterClass = (filterName: StatusType) => {
		const base = "rounded-lg px-3 py-1.5 font-semibold text-xs transition-colors";

		if (activeFilter === filterName) return `${base} bg-blue-600 text-white shadow-xs`;

		return `${base} border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800`;
	};

	return (
		<div className='flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between'>
			<div className='flex flex-wrap items-center gap-2'>
				<Link
					href={prevUrl}
					className='rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
					<ChevronLeft size={16} />
				</Link>
				<div className='flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200'>
					<CalendarIcon size={14} className='text-blue-500' />
					<span>{formattedDateHeader}</span>
				</div>
				<Link
					href={nextUrl}
					className='rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
					<ChevronRight size={16} />
				</Link>
				<Link
					href={toggleViewUrl}
					className='ml-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
					{isMonthlyView ? "View All Year" : "View by Month"}
				</Link>
			</div>

			<div className='flex flex-wrap items-center gap-2 text-xs font-medium'>
				<span className='flex items-center gap-1 pr-1 text-slate-400 dark:text-slate-500'>
					<Filter size={14} /> Filter:
				</span>
				<Link href={buildUrl("all")} className={getFilterClass("all")}>
					All
				</Link>
				<Link href={buildUrl("Upcoming")} className={getFilterClass("Upcoming")}>
					Upcoming
				</Link>
				<Link href={buildUrl("Completed")} className={getFilterClass("Completed")}>
					Completed
				</Link>
			</div>
		</div>
	);
};
export default ScheduleFilters;
