import { auth } from "@auth";
import {
	BookOpen,
	Clock,
	Download,
	ExternalLink,
	FileText,
	PlayCircle,
	Search,
	Sparkles,
	Video,
} from "lucide-react";
import Link from "next/link";

interface Lesson {
	id: string;
	title: string;
	subject: string;
	tutorOrStudent: string;
	date: string;
	duration: string;
	status: "Live Now" | "Upcoming" | "Completed";
	hasRecording?: boolean;
	resourcesCount: number;
}

const renderStatusBadge = (lesson: Lesson) => {
	if (lesson.status === "Live Now") {
		return (
			<span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
				<span className='h-2 w-2 animate-ping rounded-full bg-emerald-500' />
				Live Now
			</span>
		);
	}

	return (
		<span className='text-xs font-medium text-slate-500 dark:text-slate-400'>{lesson.date}</span>
	);
};

const renderActions = (lesson: Lesson) => {
	if (lesson.status === "Live Now") {
		return (
			<Link
				href={`/dashboard/lessons/${lesson.id}`}
				className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-[0.98]'>
				<Video size={14} /> Join Now
			</Link>
		);
	}

	if (lesson.status === "Completed") {
		return (
			<div className='flex items-center gap-2'>
				{lesson.hasRecording && (
					<button className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'>
						<PlayCircle size={14} className='text-blue-500' /> Watch
					</button>
				)}
				<button className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'>
					<Download size={14} />
				</button>
			</div>
		);
	}

	return (
		<Link
			href={`/dashboard/lessons/${lesson.id}`}
			className='inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400'>
			Classroom Details <ExternalLink size={14} />
		</Link>
	);
};

const LessonsPage = async () => {
	const session = await auth();
	const isTeacher = session?.user?.role === "Teacher";

	const lessons: Lesson[] = [
		{
			id: "1",
			title: "Quadratic Equations & Calculus Intro",
			subject: "GCSE Mathematics",
			tutorOrStudent: isTeacher ? "Alex Morgan" : "Dr. Aris Thorne",
			date: "Today, Aug 8 • 4:00 PM",
			duration: "60 mins",
			status: "Live Now",
			resourcesCount: 3,
		},
		{
			id: "2",
			title: "Electromagnetism & Wave Phenomena",
			subject: "GCSE Physics",
			tutorOrStudent: isTeacher ? "Liam Davies" : "Sarah Jenkins",
			date: "Tomorrow, Aug 9 • 5:30 PM",
			duration: "60 mins",
			status: "Upcoming",
			resourcesCount: 2,
		},
		{
			id: "3",
			title: "Cellular Biology & Genetics",
			subject: "GCSE Biology",
			tutorOrStudent: isTeacher ? "Sophia Lin" : "Dr. Rosalind Franklin",
			date: "Aug 6, 2026",
			duration: "60 mins",
			status: "Completed",
			hasRecording: true,
			resourcesCount: 4,
		},
		{
			id: "4",
			title: "Stoichiometry & Chemical Calculations",
			subject: "GCSE Chemistry",
			tutorOrStudent: isTeacher ? "Emma Watson" : "Prof. Michael Faraday",
			date: "Aug 3, 2026",
			duration: "60 mins",
			status: "Completed",
			hasRecording: true,
			resourcesCount: 1,
		},
	];

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			{/* HEADER SECTION */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						My Lessons & Canvases
					</h1>
					<p className='text-sm text-slate-500 dark:text-slate-400'>
						Access live classrooms, view past recordings, and download study notes.
					</p>
				</div>
			</div>

			{/* CONTROLS & SEARCH */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				{/* Search Bar */}
				<div className='relative flex-1 max-w-md'>
					<Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
					<input
						type='text'
						placeholder='Search by topic, subject, or tutor...'
						className='w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500'
					/>
				</div>

				{/* Tab Filters */}
				<div className='flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400'>
					<button className='rounded-lg bg-blue-600 px-3 py-1.5 text-white'>All Lessons</button>
					<button className='rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800'>
						Recordings
					</button>
					<button className='rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800'>
						Notes & PDF
					</button>
				</div>
			</div>

			{/* LESSON CARDS GRID */}
			<div className='grid gap-6 md:grid-cols-2'>
				{lessons.map((lesson) => {
					const isLive = lesson.status === "Live Now";

					return (
						<div
							key={lesson.id}
							className={`group flex flex-col justify-between rounded-2xl border p-6 transition-all ${
								isLive
									? "border-blue-500/50 bg-blue-500/5 shadow-md dark:border-blue-500/40 dark:bg-blue-950/20"
									: "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700"
							}`}>
							{/* TOP INFO */}
							<div className='space-y-3'>
								<div className='flex items-center justify-between'>
									<span className='rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400'>
										{lesson.subject}
									</span>

									{renderStatusBadge(lesson)}
								</div>

								<h3 className='text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400'>
									{lesson.title}
								</h3>

								<p className='text-xs text-slate-500 dark:text-slate-400'>
									{isTeacher ? "Student" : "Tutor"}:{" "}
									<span className='font-semibold text-slate-700 dark:text-slate-300'>
										{lesson.tutorOrStudent}
									</span>
								</p>
							</div>

							{/* BOTTOM ACTIONS */}
							<div className='mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/60'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
										<span className='flex items-center gap-1'>
											<Clock size={14} /> {lesson.duration}
										</span>
										<span>•</span>
										<span className='flex items-center gap-1'>
											<FileText size={14} /> {lesson.resourcesCount} Files
										</span>
									</div>

									{/* Dynamic CTA depending on Status */}
									{renderActions(lesson)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default LessonsPage;
