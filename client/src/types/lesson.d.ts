interface Lesson {
  id: string;
  subject: string;
  topic: string;
  meetingRoomId: string;
  startTime: string;
  duration: number;
  status: StatusType;
  notes: string;
  student?: Student;
  teacher?: Teacher;
}

interface Teacher {
  name: string;
  image: string;
  email: string;
}

interface Student {
  name: string;
  image: string;
  email: string;
}

type StatusType = "all" | "Upcoming" | "Confirmed" | "Completed" | "Cancelled";
type SortDirection = "asc" | "desc";

// The schedule page's filter/sort/date state — ScheduleFilters and
// SchedulePagination both need it to build their links, so it's passed as
// one object instead of four separate, identically-named props.
interface ScheduleQueryState {
  filter: StatusType;
  sort: SortDirection;
  year: number;
  month?: number;
}
