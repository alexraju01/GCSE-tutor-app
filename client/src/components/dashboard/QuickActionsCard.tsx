"use client";

import { Calendar, Plus, Video, BookOpen, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ScheduleCalendarModal from "./calendar/ScheduleCalendarModal";
import { TimeSlot } from "@utils/actions/availability";

export interface AvailabilityPayloadItem {
	id?: string;
	teacherId?: string;
	startTime?: string;
	endTime?: string;
	date?: string;
	dayOfWeek?: string;
}

interface QuickActionsCardProps {
	availabilitySlots?: TimeSlot[] | AvailabilityPayloadItem[];
	token?: string;
}

const QuickActionsCard = ({ availabilitySlots = [], token }: QuickActionsCardProps) => {
	const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
	const router = useRouter();

	const handleModalClose = () => {
		setIsCalendarModalOpen(false);
		// Revalidates Server Component data from the backend
		router.refresh();
	};

	return (
		<>
			<div className='flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
				{/* Availability Section */}
				<div>
					<div className='flex items-center justify-between mb-3'>
						<h3 className='text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
							<Clock className='w-4 h-4 text-blue-600 dark:text-blue-400' />
							Schedule & Availability
						</h3>
						<span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'>
							{availabilitySlots.length} Slots
						</span>
					</div>

					<p className='text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed'>
						Manage your teaching hours so students can book upcoming tutoring slots.
					</p>

					<button
						type='button'
						onClick={() => setIsCalendarModalOpen(true)}
						className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-98 cursor-pointer'>
						<Calendar size={15} />
						Manage Calendar
					</button>
				</div>

				<hr className='border-slate-100 dark:border-slate-800' />

				{/* Quick Tools Section */}
				<div>
					<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3'>
						Quick Tools
					</h4>

					<div className='flex flex-col gap-2.5'>
						<button
							type='button'
							onClick={() => setIsCalendarModalOpen(true)}
							className='flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 text-left text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer'>
							<div className='flex items-center gap-2.5'>
								<div className='rounded-lg bg-blue-100/80 p-1.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'>
									<Plus size={14} />
								</div>
								<span>Set Available Hours</span>
							</div>
						</button>

						<a
							href='/whiteboard'
							className='flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 text-left text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'>
							<div className='flex items-center gap-2.5'>
								<div className='rounded-lg bg-indigo-100/80 p-1.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'>
									<Video size={14} />
								</div>
								<span>Launch Collaborative Canvas</span>
							</div>
						</a>

						<a
							href='/profile/subjects'
							className='flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 text-left text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'>
							<div className='flex items-center gap-2.5'>
								<div className='rounded-lg bg-emerald-100/80 p-1.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'>
									<BookOpen size={14} />
								</div>
								<span>Update GCSE Subjects</span>
							</div>
						</a>
					</div>
				</div>
			</div>

			{/* Calendar Modal */}
			<ScheduleCalendarModal
				isOpen={isCalendarModalOpen}
				onClose={handleModalClose}
				initialSlots={availabilitySlots as TimeSlot[]}
				token={token}
			/>
		</>
	);
};

export default QuickActionsCard;
