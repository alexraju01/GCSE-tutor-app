interface UpcomingLessonBase {
  id: string;
  subject: string;
  topic: string;
  time: string;
  status: "Upcoming" | "Confirmed" | "Completed" | "Cancelled" | "Pending";
}

interface StudentSession extends UpcomingLessonBase {
  student: string;
  studentImage?: string;
}

interface Teaches {
  id: string;
  subject:
    | "Biology"
    | "Physics"
    | "Chemistry"
    | "English Literature"
    | "Computer Science";
  level: "A LEVEL" | "GCSE";
}

interface TeacherDashboardData {
  totalEarnings: {
    amount: number;
    currency: string;
  };
  teaches: Teaches[];
  completedLessons: number;
  activeStudents: number;
  totalHoursTaught: number;
  upcomingLessons?: StudentSession[];
}

interface StudentDashboardData {
  completedLessons: number;
  activeTeachers: number;
  totalHoursLearned: number;
  upcomingLessons?: StudentUpcomingLesson[];
  subjects?: Subject[];
}

interface StudentUpcomingLesson extends UpcomingLessonBase {
  teacher: string;
  teacherImage?: string;
}
interface Subject {
  id: string | number;
  subject: string;
  level: string;
}
