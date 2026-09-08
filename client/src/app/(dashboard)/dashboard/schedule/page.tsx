import { auth } from "@auth";
import ScheduleHeader from "@components/dashboard/calendar/ScheduleHeader";
import ScheduleFilters from "@components/dashboard/schedule/ScheduleFilters";
import ScheduleItemCard from "@components/dashboard/schedule/ScheduleItemCard";
import SchedulePagination from "@components/dashboard/schedule/SchedulePagination";
import type { TimeSlot } from "@utils/actions/availability";
import { api } from "@utils/api";
import { formatHeaderDate } from "@utils/date";

interface SchedulePageProps {
  searchParams: Promise<{
    filter?: string;
    month?: string;
    year?: string;
    page?: string;
  }>;
}

const resolveInitialAvailability = (
  availabilityResponse: unknown,
): TimeSlot[] => {
  if (
    typeof availabilityResponse === "object" &&
    availabilityResponse !== null &&
    "data" in availabilityResponse &&
    Array.isArray((availabilityResponse as { data: unknown }).data)
  ) {
    return (availabilityResponse as { data: TimeSlot[] }).data;
  }

  if (Array.isArray(availabilityResponse)) {
    return availabilityResponse as TimeSlot[];
  }

  return [];
};

const SchedulePage = async ({ searchParams }: SchedulePageProps) => {
  const params = await searchParams;
  const activeFilter = (params.filter?.toLowerCase() as StatusType) || "all";
  const currentPage = params.page ? parseInt(params.page, 10) : 1;
  const currentDate = new Date();
  const selectedYear = params.year
    ? parseInt(params.year, 10)
    : currentDate.getFullYear();
  const selectedMonth = params.month
    ? parseInt(params.month, 10) - 1
    : undefined;

  const formattedDateHeader =
    selectedMonth !== undefined
      ? formatHeaderDate(selectedYear, selectedMonth)
      : formatHeaderDate(selectedYear);

  const session = await auth();
  const isTeacher = session?.user?.role === "Teacher";
  const teacherId = session?.user?.id ?? "";
  const token = session?.backendToken ?? "";

  const lessonStatus = activeFilter !== "all" ? activeFilter : undefined;
  const lessonMonth =
    selectedMonth !== undefined ? selectedMonth + 1 : undefined;

  // Parallel data fetching on the server
  const [lessonsResponse, availabilityResponse] = await Promise.all([
    api.lesson.getAll(token, {
      page: currentPage,
      status: lessonStatus,
      year: selectedYear,
      month: lessonMonth,
    }),
    isTeacher && teacherId
      ? api.availability.getByTeacherId(teacherId, token)
      : null,
  ]);

  const lessons = lessonsResponse?.data ?? [];
  const totalPages = lessonsResponse?.totalPages ?? 1;
  const totalResults = lessonsResponse?.totalResults ?? lessons.length;

  // Extract initial availability without nested ternaries
  const initialAvailability = resolveInitialAvailability(availabilityResponse);

  const filterLabel = activeFilter !== "all" ? `${activeFilter} ` : "";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ScheduleHeader
        isTeacher={isTeacher}
        token={token}
        initialSlots={initialAvailability}
      />

      <ScheduleFilters
        activeFilter={activeFilter}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        formattedDateHeader={formattedDateHeader}
      />

      <div className="space-y-4">
        {lessons.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No {filterLabel}scheduled lessons found for {formattedDateHeader}.
            </p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <ScheduleItemCard
              key={lesson.id}
              lesson={lesson}
              isTeacher={isTeacher}
            />
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
