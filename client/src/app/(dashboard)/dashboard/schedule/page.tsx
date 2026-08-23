import { auth } from "@auth";
import ScheduleHeader from "@components/dashboard/calendar/ScheduleHeader";
import { api } from "@utils/api";
import { formatHeaderDate } from "@utils/date";
import type { TimeSlot } from "@utils/actions/availability";
import ScheduleFilters from "@components/dashboard/schedule/ScheduleFilters";
import ScheduleItemCard from "@components/dashboard/schedule/ScheduleItemCard";
import SchedulePagination from "@components/dashboard/schedule/SchedulePagination";

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
	const activeFilter = (params.filter?.toLowerCase() as StatusType) || "all";
	const currentPage = params.page ? parseInt(params.page, 10) : 1;
	const currentDate = new Date();
	const selectedYear = params.year ? parseInt(params.year, 10) : currentDate.getFullYear();
	const selectedMonth = params.month ? parseInt(params.month, 10) - 1 : undefined;

	const formattedDateHeader =
		selectedMonth !== undefined
			? formatHeaderDate(selectedYear, selectedMonth)
			: formatHeaderDate(selectedYear);

	const session = await auth();
	const isTeacher = session?.user?.role === "Teacher";
	const token = session?.backendToken ?? "";

	// Parallel data fetching on the server
	const [lessonsResponse, rawAvailabilityResponse] = await Promise.all([
		api.lesson.getAll(token, {
			page: currentPage,
			status: activeFilter !== "all" ? activeFilter : undefined,
			year: selectedYear,
			month: selectedMonth !== undefined ? selectedMonth + 1 : undefined,
		}),
		isTeacher && token ? api.availability.getAll(token) : null,
	]);

	const lessons = lessonsResponse?.data ?? [];
	const totalPages = lessonsResponse?.totalPages ?? 1;
	const totalResults = lessonsResponse?.totalResults ?? lessons.length;

	const initialAvailability: TimeSlot[] = Array.isArray(rawAvailabilityResponse)
		? rawAvailabilityResponse
		: (rawAvailabilityResponse as { data?: TimeSlot[] })?.data || [];

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			<ScheduleHeader isTeacher={isTeacher} token={token} initialSlots={initialAvailability} />

			<ScheduleFilters
				activeFilter={activeFilter}
				selectedYear={selectedYear}
				selectedMonth={selectedMonth}
				formattedDateHeader={formattedDateHeader}
			/>

			<div className='space-y-4'>
				{lessons.length === 0 ? (
					<div className='rounded-xl border border-slate-200/80 bg-white py-12 text-center shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
						<p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
							No {activeFilter !== "all" ? activeFilter : ""} scheduled lessons found for{" "}
							{formattedDateHeader}.
						</p>
					</div>
				) : (
					lessons.map((lesson) => (
						<ScheduleItemCard key={lesson.id} lesson={lesson} isTeacher={isTeacher} />
					))
				)}
			</div>

			{totalPages > 1 && (
				<SchedulePagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalResults={totalResults}
					activeFilter={activeFilter}
					selectedYear={selectedYear}
					selectedMonth={selectedMonth}
				/>
			)}
		</div>
	);
};
export default SchedulePage;
