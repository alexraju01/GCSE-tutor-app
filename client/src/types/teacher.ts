export interface TeachesSubject {
	id: string;
	subject:
		| "MATHEMATICS"
		| "PHYSICS"
		| "CHEMISTRY"
		| "BIOLOGY"
		| "ENGLISH_LITERATURE"
		| "COMPUTER_SCIENCE";
	level: "GCSE" | "A_LEVEL";
}

export interface Teacher {
	id: string;
	userId: string;
	name: string | null;
	email: string;
	image: string | null;
	bio: string;
	user: User;
	qualifications: string;
	hourlyRate: number;
	teaches: TeachesSubject[];
}

export interface TeachersAPIResponse {
	status: string;
	results: number;
	data: Teacher[];
}

interface User {
	name: string;
	email: string;
	image: string;
}
