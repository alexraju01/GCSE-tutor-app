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
