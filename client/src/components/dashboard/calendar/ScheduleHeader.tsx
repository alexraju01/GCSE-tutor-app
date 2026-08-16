"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import ScheduleCalendarModal from "./ScheduleCalendarModal";
import { TimeSlot } from "@utils/actions/availability";
import type { Booking } from "./ScheduleCalendar";

interface ScheduleHeaderProps {
	isTeacher: boolean;
	token?: string;
	initialSlots?: TimeSlot[];
	bookings?: Booking[];
}

const ScheduleHeader = ({ isTeacher, token, initialSlots = [] }: ScheduleHeaderProps) => {
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);

	return (
		<>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Schedule & Bookings
					</h1>

					<p className='text-sm text-slate-500 dark:text-slate-400'>
						Manage your upcoming live tutoring sessions and past lessons.
					</p>
				</div>

				<div className='flex items-center gap-3'>
					{isTeacher ? (
						<button
							type='button'
							onClick={() => setIsCalendarOpen(true)}
							className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]'>
							<Plus size={16} />
							Set Availability
						</button>
					) : (
						<Link
							href='/teachers'
							className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]'>
							<Plus size={16} />
							Book New Lesson
						</Link>
					)}
				</div>
			</div>

			<ScheduleCalendarModal
				isOpen={isCalendarOpen}
				onClose={() => setIsCalendarOpen(false)}
				initialSlots={initialSlots}
				token={token}
			/>
		</>
	);
};

export default ScheduleHeader;
