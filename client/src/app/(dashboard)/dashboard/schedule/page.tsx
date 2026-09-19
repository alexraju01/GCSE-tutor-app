import { auth } from "@auth";
import ScheduleHeader from "@components/dashboard/calendar/ScheduleHeader";
import ScheduleFilters, {
  FILTER_OPTIONS,
} from "@components/dashboard/schedule/ScheduleFilters";
import ScheduleItemCard from "@components/dashboard/schedule/ScheduleItemCard";
import SchedulePagination from "@components/dashboard/schedule/SchedulePagination";
import type { TimeSlot } from "@utils/actions/availability";
import { api } from "@utils/api";
import { formatHeaderDate } from "@utils/date";
import { nowInUk } from "@utils/ukTime";

interface SchedulePageProps {
  searchParams: Promise<{
    filter?: string;
    month?: string;
    year?: string;
    page?: string;
    sort?: string;
  }>;
}

// A "past" filter reads more naturally most-recent-first; anything still
// ahead of you reads more naturally soonest-first.
const DEFAULT_SORT_BY_FILTER: Record<StatusType, SortDirection> = {
  all: "asc",
  Upcoming: "asc",
  Confirmed: "asc",
  Completed: "desc",
  Cancelled: "desc",
};

const normalizeFilter = (raw?: string): StatusType => {
  const match = FILTER_OPTIONS.find(
    (option) => option.value.toLowerCase() === raw?.toLowerCase(),
  );
  return match?.value ?? "all";
};

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
  const activeFilter = normalizeFilter(params.filter);
  const activeSort: SortDirection =
    params.sort === "asc" || params.sort === "desc"
      ? params.sort
      : DEFAULT_SORT_BY_FILTER[activeFilter];
  const currentPage = params.page ? parseInt(params.page, 10) : 1;
  // Server's own clock isn't necessarily UK time.
  const currentDate = nowInUk();
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
      sort: activeSort,
    }),
    isTeacher && teacherId
      ? api.availability.getMyTeacherAvailabilities(token)
      : null,
  ]);

  const lessons = lessonsResponse?.data ?? [];
  const totalPages = lessonsResponse?.pagination?.totalPages ?? 1;
  const totalResults =
    lessonsResponse?.pagination?.totalResults ?? lessons.length;

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
        activeSort={activeSort}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        formattedDateHeader={formattedDateHeader}
      />

      <div className="space-y-4">
        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
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
          activeSort={activeSort}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      )}
    </div>
  );
};

export default SchedulePage;
