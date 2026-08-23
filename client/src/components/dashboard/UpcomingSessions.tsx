import { ArrowUpRight, Clock, User, Video } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

interface UpcomingSessionsProps {
	sessions?: StudentSession[];
}

const UpcomingSessions = ({ sessions = [] }: UpcomingSessionsProps) => {
	return (
		<div className='space-y-4 lg:col-span-2'>
			<div className='flex items-center justify-between'>
				<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
					Today&apos;s Teaching Schedule
				</h2>
				<Link
					href={"/dashboard/schedule" as Route}
					className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400'>
					Full Calendar <ArrowUpRight size={14} />
				</Link>
			</div>

			<div className='space-y-3'>
				{sessions.length === 0 ? (
					<div className='rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400'>
						No upcoming sessions scheduled for today.
					</div>
				) : (
					sessions.map((sessionItem) => (
						<div
							key={sessionItem.id}
							className='flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700 sm:flex-row sm:items-center'>
							<div className='flex items-start gap-3.5'>
								<div className='relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500'>
									{sessionItem.studentImage ? (
										<Image
											src={sessionItem.studentImage}
											alt={sessionItem.student}
											fill
											className='object-cover'
										/>
									) : (
										<User size={22} className='mt-1' />
									)}
								</div>

								<div className='space-y-1'>
									<div className='flex items-center gap-2'>
										<span className='rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
											{sessionItem.subject}
										</span>
										<span className='text-xs text-slate-400'>•</span>
										<span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
											Student:{" "}
											<strong className='text-slate-700 dark:text-slate-200'>
												{sessionItem.student}
											</strong>
										</span>
									</div>
									<h3 className='font-semibold text-slate-900 dark:text-slate-100'>
										{sessionItem.topic}
									</h3>
									<p className='flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
										<Clock size={14} /> {sessionItem.time}
									</p>
								</div>
							</div>

							<Link
								href={`/dashboard/lessons/${sessionItem.id}` as Route}
								className='inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.98]'>
								<Video size={14} /> Launch Classroom
							</Link>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default UpcomingSessions;
