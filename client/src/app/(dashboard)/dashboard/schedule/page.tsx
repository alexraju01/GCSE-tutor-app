import { auth } from "@auth";
import ScheduleHeader from "@components/dashboard/calendar/ScheduleHeader";
import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Filter,
	GraduationCap,
	Video,
	Clock,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { api } from "@utils/api";
import { TimeSlot } from "@utils/actions/availability";

type FilterType = "all" | "upcoming" | "completed";

const mapStatus = (status: string): "Upcoming" | "Completed" | "Cancelled" => {
	switch (status.toUpperCase()) {
		case "CONFIRMED":
		case "UPCOMING":
		case "SCHEDULED":
			return "Upcoming";
		case "COMPLETED":
			return "Completed";
		case "CANCELLED":
		case "CANCELED":
			return "Cancelled";
		default:
			return "Upcoming";
	}
};

interface SchedulePageProps {
	searchParams: Promise<{
		filter?: string;
		month?: string;
		year?: string;
		page?: string;
	}>;
}

const SchedulePage = async ({ searchParams }: SchedulePageProps) => {
	const params = await searchParams;
	const activeFilter: FilterType = (params.filter?.toLowerCase() as FilterType) || "all";
	const currentPage = params.page ? parseInt(params.page, 10) : 1;
	const currentDate = new Date();
	const selectedYear = params.year ? parseInt(params.year, 10) : currentDate.getFullYear();
	const isMonthlyView = Boolean(params.month);
	const selectedMonth = isMonthlyView ? parseInt(params.month!, 10) - 1 : currentDate.getMonth();

	let prevUrl = "";
	let nextUrl = "";
	let formattedDateHeader = "";

	if (isMonthlyView) {
		const activeDate = new Date(selectedYear, selectedMonth, 1);
		const prevDate = new Date(selectedYear, selectedMonth - 1, 1);
		const nextDate = new Date(selectedYear, selectedMonth + 1, 1);

		prevUrl = `/dashboard/schedule?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}&filter=${activeFilter}&page=1`;
		nextUrl = `/dashboard/schedule?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}&filter=${activeFilter}&page=1`;
		formattedDateHeader = activeDate.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	} else {
		prevUrl = `/dashboard/schedule?year=${selectedYear - 1}&filter=${activeFilter}&page=1`;
		nextUrl = `/dashboard/schedule?year=${selectedYear + 1}&filter=${activeFilter}&page=1`;
		formattedDateHeader = `${selectedYear}`;
	}

	const session = await auth();
	const isTeacher = session?.user?.role === "Teacher";
	const token = session?.backendToken ?? "";

	const [{ data: lessons }, rawAvailabilityResponse] = await Promise.all([
		api.lesson.getAll(token, { page: currentPage }),
		isTeacher && token ? api.availability.getAll(token) : null,
	]);

	const initialAvailability: TimeSlot[] = Array.isArray(rawAvailabilityResponse)
		? rawAvailabilityResponse
		: (rawAvailabilityResponse as { data?: TimeSlot[] })?.data || [];

	const bookedLessons = lessons ?? [];
	// const totalPages = lessons?.totalPages ?? 1;
	// const totalResults = lessons?.totalResults ?? bookings.length;

	const scheduledLessons = bookedLessons
		.map((item) => {
			const startDate = new Date(item.startTime);
			const endDate = new Date(startDate.getTime() + item.duration * 60000);
			const mappedStatus = mapStatus(item.status);

			const formattedDate = startDate.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});

			const startTimeStr = startDate.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			});

			const endTimeStr = endDate.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			});

			const targetPerson = isTeacher ? item.student : item.tutor;
			const personName =
				targetPerson?.name ||
				[targetPerson?.firstName, targetPerson?.lastName].filter(Boolean).join(" ") ||
				"Unknown";

			const formattedSubject =
				item.subject.charAt(0).toUpperCase() + item.subject.slice(1).toLowerCase();

			return {
				id: item.id,
				title: item.topic,
				subject: formattedSubject,
				tutorOrStudent: personName,
				roleLabel: isTeacher ? "Student" : "Tutor",
				date: formattedDate,
				time: `${startTimeStr} - ${endTimeStr}`,
				duration: `${item.duration} mins`,
				status: mappedStatus,
				meetingUrl:
					mappedStatus === "Upcoming" ? (`/dashboard/lessons/${item.id}` as Route) : undefined,
				rawStartDate: startDate,
			};
		})
		.filter((item) => {
			const matchesYear = item.rawStartDate.getFullYear() === selectedYear;
			if (!matchesYear) return false;

			if (isMonthlyView) {
				const matchesMonth = item.rawStartDate.getMonth() === selectedMonth;
				if (!matchesMonth) return false;
			}

			if (activeFilter === "upcoming") return item.status === "Upcoming";
			if (activeFilter === "completed") return item.status === "Completed";

			return true;
		});

	const getFilterClass = (filterName: FilterType) => {
		const baseClass = "rounded-lg px-3 py-1.5 font-semibold text-xs transition-colors ";
		if (activeFilter === filterName) {
			return baseClass + "bg-blue-600 text-white shadow-xs";
		}
		return (
			baseClass +
			"border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
		);
	};

	const buildUrl = (newFilter: FilterType, newPage = 1) => {
		const monthQuery = isMonthlyView ? `month=${selectedMonth + 1}&` : "";
		return `/dashboard/schedule?${monthQuery}year=${selectedYear}&filter=${newFilter}&page=${newPage}`;
	};

	const getPaginationUrl = (pageNumber: number) => buildUrl(activeFilter, pageNumber);

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			<ScheduleHeader isTeacher={isTeacher} token={token} initialSlots={initialAvailability} />
			<div className='flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between'>
				<div className='flex flex-wrap items-center gap-2'>
					<Link
						href={prevUrl}
						aria-label={isMonthlyView ? "Previous month" : "Previous year"}
						className='rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						<ChevronLeft size={16} />
					</Link>
					<div className='flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200'>
						<CalendarIcon size={14} className='text-blue-500' />
						<span>{formattedDateHeader}</span>
					</div>
					<Link
						href={nextUrl}
						aria-label={isMonthlyView ? "Next month" : "Next year"}
						className='rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						<ChevronRight size={16} />
					</Link>
					<Link
						href={
							isMonthlyView
								? `/dashboard/schedule?year=${selectedYear}&filter=${activeFilter}&page=1`
								: `/dashboard/schedule?month=${currentDate.getMonth() + 1}&year=${selectedYear}&filter=${activeFilter}&page=1`
						}
						className='ml-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
						{isMonthlyView ? "View All Year" : "View by Month"}
					</Link>
				</div>
				<div className='flex flex-wrap items-center gap-2 text-xs font-medium'>
					<span className='flex items-center gap-1 pr-1 text-slate-400 dark:text-slate-500'>
						<Filter size={14} />
						Filter:
					</span>
					<Link href={buildUrl("all")} className={getFilterClass("all")}>
						All
					</Link>
					<Link href={buildUrl("upcoming")} className={getFilterClass("upcoming")}>
						Upcoming
					</Link>
					<Link href={buildUrl("completed")} className={getFilterClass("completed")}>
						Completed
					</Link>
				</div>
			</div>
			<div className='space-y-4'>
				{scheduleItems.length === 0 ? (
					<div className='rounded-xl border border-slate-200/80 bg-white py-12 text-center shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
						<p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
							No {activeFilter !== "all" ? activeFilter : ""} scheduled lessons found for{" "}
							{formattedDateHeader}.
						</p>
					</div>
				) : (
					scheduleItems.map((item) => {
						const isUpcoming = item.status === "Upcoming";
						return (
							<div
								key={item.id}
								className='flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700 md:flex-row md:items-center'>
								<div className='flex items-start gap-4 md:w-1/3'>
									<div className='flex flex-col items-center justify-center rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400'>
										<Clock size={20} />
									</div>
									<div>
										<p className='text-sm font-bold text-slate-900 dark:text-slate-100'>
											{item.date}
										</p>
										<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
											{item.time} ({item.duration})
										</p>
										<span
											className={`mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
												isUpcoming
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "bg-slate-500/10 text-slate-600 dark:text-slate-400"
											}`}>
											{item.status}
										</span>
									</div>
								</div>
								<div className='space-y-1 md:w-1/3'>
									<div className='flex items-center gap-2'>
										<span className='rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
											{item.subject}
										</span>
									</div>
									<h3 className='font-semibold text-slate-900 dark:text-slate-100'>{item.title}</h3>
									<p className='flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
										<GraduationCap size={14} />
										<span>
											{item.roleLabel}:{" "}
											<strong className='text-slate-700 dark:text-slate-300'>
												{item.tutorOrStudent}
											</strong>
										</span>
									</p>
								</div>
								<div className='flex items-center justify-end gap-3 md:w-1/3'>
									{isUpcoming && item.meetingUrl ? (
										<Link
											href={item.meetingUrl}
											className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]'>
											<Video size={14} />
											Enter Classroom
										</Link>
									) : (
										<button
											disabled={!isUpcoming}
											className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
											{isUpcoming ? "Reschedule" : "View Notes"}
										</button>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>
			{totalPages > 1 && (
				<div className='flex flex-col gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80'>
					<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
						Showing page{" "}
						<strong className='font-semibold text-slate-900 dark:text-slate-100'>
							{currentPage}
						</strong>{" "}
						of{" "}
						<strong className='font-semibold text-slate-900 dark:text-slate-100'>
							{totalPages}
						</strong>{" "}
						<span className='text-slate-400 dark:text-slate-500'>
							({totalResults} total lessons)
						</span>
					</p>
					<nav aria-label='Pagination Navigation' className='flex items-center gap-1.5'>
						<Link
							href={getPaginationUrl(currentPage - 1)}
							aria-disabled={currentPage <= 1}
							tabIndex={currentPage <= 1 ? -1 : undefined}
							className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all dark:border-slate-800 dark:text-slate-300 ${
								currentPage <= 1
									? "pointer-events-none opacity-40"
									: "hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97] dark:hover:bg-slate-800 dark:hover:text-slate-100"
							}`}>
							<ChevronLeft size={14} />
							<span className='hidden sm:inline'>Previous</span>
						</Link>
						<div className='flex items-center gap-1'>
							{Array.from({ length: totalPages }, (_, index) => index + 1)
								.filter(
									(page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
								)
								.reduce<(number | string)[]>((acc, page, i, arr) => {
									if (i > 0 && page - (arr[i - 1] as number) > 1) {
										acc.push("...");
									}
									acc.push(page);
									return acc;
								}, [])
								.map((item, idx) => {
									if (item === "...") {
										return (
											<span
												key={`ellipse-${idx}`}
												className='px-2 text-xs text-slate-400 dark:text-slate-600'>
												•••
											</span>
										);
									}
									const pageNum = item as number;
									const isActive = pageNum === currentPage;
									return (
										<Link
											key={pageNum}
											href={getPaginationUrl(pageNum)}
											aria-current={isActive ? "page" : undefined}
											className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all ${
												isActive
													? "bg-blue-600 text-white shadow-xs"
													: "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
											}`}>
											{pageNum}
										</Link>
									);
								})}
						</div>
						<Link
							href={getPaginationUrl(currentPage + 1)}
							aria-disabled={currentPage >= totalPages}
							tabIndex={currentPage >= totalPages ? -1 : undefined}
							className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all dark:border-slate-800 dark:text-slate-300 ${
								currentPage >= totalPages
									? "pointer-events-none opacity-40"
									: "hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97] dark:hover:bg-slate-800 dark:hover:text-slate-100"
							}`}>
							<span className='hidden sm:inline'>Next</span>
							<ChevronRight size={14} />
						</Link>
					</nav>
				</div>
			)}
		</div>
	);
};

export default SchedulePage;
