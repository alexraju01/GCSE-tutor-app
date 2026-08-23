interface Lesson {
	id: string;
	subject: string;
	topic: string;
	meetingRoomId: string;
	startTime: string;
	// tutorOrStudent: string;
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

// interface Lesson {
// 	id: string;
// 	subject: string;
// 	topic: string;
// 	meetingRoomId: string | null;
// 	startTime: string;
// 	duration: number;
// 	status: string;
// 	notes?: string;
// 	student?: Student;
// 	tutor?: Tutor;
// }

type StatusType = "all" | "Upcoming" | "Completed" | "Cancelled" | "Pending";

interface SchedulePageProps {
	searchParams: Promise<{
		filter?: string;
		month?: string;
		year?: string;
		page?: string;
	}>;
}
