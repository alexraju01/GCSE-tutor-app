import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SchedulePaginationProps {
	currentPage: number;
	totalPages: number;
	totalResults: number;
	activeFilter: string;
	selectedYear: number;
	selectedMonth?: number;
}

const SchedulePagination = ({
	currentPage,
	totalPages,
	totalResults,
	activeFilter,
	selectedYear,
	selectedMonth,
}: SchedulePaginationProps) => {
	const getPaginationUrl = (page: number) => {
		const params = new URLSearchParams();
		if (selectedMonth !== undefined) params.set("month", String(selectedMonth + 1));
		params.set("year", String(selectedYear));
		params.set("filter", activeFilter);
		params.set("page", String(page));
		return `/dashboard/schedule?${params.toString()}`;
	};

	const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
		.filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
		.reduce<(number | string)[]>((acc, page, i, arr) => {
			if (i > 0 && page - (arr[i - 1] as number) > 1) acc.push("...");
			acc.push(page);
			return acc;
		}, []);

	return (
		<div className='flex flex-col gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80'>
			<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
				Showing page{" "}
				<strong className='font-semibold text-slate-900 dark:text-slate-100'>{currentPage}</strong>{" "}
				of{" "}
				<strong className='font-semibold text-slate-900 dark:text-slate-100'>{totalPages}</strong>{" "}
				<span className='text-slate-400 dark:text-slate-500'>({totalResults} total lessons)</span>
			</p>

			<nav aria-label='Pagination Navigation' className='flex items-center gap-1.5'>
				<Link
					href={getPaginationUrl(currentPage - 1)}
					className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all dark:border-slate-800 dark:text-slate-300 ${
						currentPage <= 1
							? "pointer-events-none opacity-40"
							: "hover:bg-slate-100 dark:hover:bg-slate-800"
					}`}>
					<ChevronLeft size={14} /> <span className='hidden sm:inline'>Previous</span>
				</Link>

				<div className='flex items-center gap-1'>
					{pages.map((item, idx) =>
						item === "..." ? (
							<span
								key={`ellipse-${idx}`}
								className='px-2 text-xs text-slate-400 dark:text-slate-600'>
								• • •
							</span>
						) : (
							<Link
								key={item}
								href={getPaginationUrl(item as number)}
								className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
									item === currentPage
										? "bg-blue-600 text-white shadow-xs"
										: "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
								}`}>
								{item}
							</Link>
						),
					)}
				</div>

				<Link
					href={getPaginationUrl(currentPage + 1)}
					className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all dark:border-slate-800 dark:text-slate-300 ${
						currentPage >= totalPages
							? "pointer-events-none opacity-40"
							: "hover:bg-slate-100 dark:hover:bg-slate-800"
					}`}>
					<span className='hidden sm:inline'>Next</span> <ChevronRight size={14} />
				</Link>
			</nav>
		</div>
	);
};

export default SchedulePagination;
