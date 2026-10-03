type LessonStatus = "Pending" | "Upcoming" | "Confirmed" | "Declined" | "Cancelled" | "Completed";

interface Lesson {
  id: string;
  subject: string;
  topic: string | null;
  startTime: string;
  duration: number;
  status: LessonStatus;
  notes: string | null;
  priceAtBooking: number | null;
  cancelledAt: string | null;
  cancelledBy: "Student" | "Teacher" | null;
  cancelReason: string | null;
  // worked out on the server from the tutor's cancellation policy
  canCancel: boolean;
  cancellationCutoffHours: number;
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

// "upcoming" = future requests + bookings (default), "all" = everything
type StatusType = "all" | "upcoming" | LessonStatus;
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
