export interface TeachesSubject {
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
	qualifications: string;
	rating: number;
	hourlyRate: number;
	totalEarnings: number;
	totalHours: number;
	teaches: TeachesSubject[];
}

export interface TeachersAPIResponse {
	status: string;
	results: number;
	data: Teacher[];
}
