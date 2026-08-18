import type { Route } from "next";

export interface Lesson {
	id: string;
	title: string;
	subject: string;
	tutorOrStudent: string;
	roleLabel: string;
	date: string;
	time: string;
	duration: string;
	status: "Upcoming" | "Completed" | "Cancelled";
	meetingUrl?: Route<string>;
	rawStartDate: Date;
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

export type FilterType = "all" | "upcoming" | "completed";

export interface SchedulePageProps {
	searchParams: Promise<{
		filter?: string;
		month?: string;
		year?: string;
		page?: string;
	}>;
}
