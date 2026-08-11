interface APIResponse<T = unknown> {
	status?: string;
	results?: number;
	data?: T;
	message?: string;
}

interface AuthCredentials {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

type AuthResponse = APIResponse<{ user: User }> & {
	token: string;
};

interface TeacherDashboardData {
	totalEarnings: { amount: number; currency: "GBP" };
	completedLessons: number;
	activeStudents: number;
	totalHoursTaught: number;
	upcomingBookings: UpcomingBooking[];
	pendingRequests: PendingRequest[];
}

interface UpcomingBooking {
	id: string;
	subject: string;
	topic: string;
	student: string;
	studentImage: string;
	time: string;
	status: string;
}
