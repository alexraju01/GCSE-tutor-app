interface StudentSession {
	id: string;
	subject: string;
	topic: string;
	student: string;
	studentImage?: string;
	time: string;
	status: "Upcoming" | "Completed" | "Cancelled" | "Pending";
}

interface Teaches {
	id: string;
	subject: "Biology" | "Physics" | "Chemistry" | "English Literature" | "Computer Science";
	level: "A LEVEL" | "GCSE";
}

interface BookingRequest {
	id: string;
	student: string;
	studentImage?: string;
	subject: string;
	date: string;
	timeSlot: string;
	duration: string;
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
	pendingRequests?: BookingRequest[];
}

interface StudentDashboardData {
	completedLessons: number;
	activeTeachers: number;
	totalHoursLearned: number;
	upcomingLessons?: StudentUpcomingLesson[];
	pendingRequests?: BookingRequest[];
}

interface StudentUpcomingLesson {
	id: string;
	subject: SubjectName;
	topic: string;
	teacher: SessionParticipant;
	teacherImage?: string;
	time: string;
	status: StatusType;
}
