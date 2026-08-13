interface StudentSession {
	id: string;
	subject: string;
	topic: string;
	student: string;
	studentImage?: string;
	time: string;
	status: "Upcoming" | "Completed" | "Cancelled";
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
	completedLessons: number;
	activeStudents: number;
	totalHoursTaught: number;
	upcomingBookings?: StudentSession[];
	pendingRequests?: BookingRequest[];
}
