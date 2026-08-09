"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import SetAvailabilityModal from "./SetAvailabilityModal";
import { TimeSlot } from "@utils/actions/availability";

interface ScheduleCalendarProps {
	isTeacher: boolean;
	initialSlots?: TimeSlot[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM (08:00 to 19:00)

const ScheduleCalendar = ({ isTeacher, initialSlots = [] }: ScheduleCalendarProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

	// Trigger modal when clicking a specific calendar grid cell
	const handleCellClick = (day: string, hour: number) => {
		if (!isTeacher) return;

		const startTime = `${hour.toString().padStart(2, "0")}:00`;
		const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

		setSelectedSlot({
			dayOfWeek: day,
			startTime,
			endTime,
		});
		setIsModalOpen(true);
	};

	// Trigger modal via main action button
	const handleOpenGeneralModal = () => {
		setSelectedSlot(null);
		setIsModalOpen(true);
	};

	return (
		<div className='space-y-6'>
			{/* HEADER WITH CONTROLS */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Schedule & Bookings
					</h1>
					<p className='text-sm text-slate-500 dark:text-slate-400'>
						Click on any day and time slot on the calendar to set your availability.
					</p>
				</div>

				{isTeacher && (
					<button
						type='button'
						onClick={handleOpenGeneralModal}
						className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]'>
						<Plus size={16} />
						Set Availability
					</button>
				)}
			</div>

			{/* CALENDAR CONTAINER */}
			<div className='overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
				{/* WEEK NAVIGATION */}
				<div className='flex items-center justify-between border-b border-slate-200/80 p-4 dark:border-slate-800/80'>
					<div className='flex items-center gap-2'>
						<button className='rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
							<ChevronLeft size={16} />
						</button>
						<span className='text-xs font-semibold text-slate-700 dark:text-slate-200'>
							Weekly View
						</span>
						<button className='rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
							<ChevronRight size={16} />
						</button>
					</div>
					<span className='text-xs text-slate-400'>Click any empty cell to add a slot</span>
				</div>

				{/* CALENDAR GRID */}
				<div className='min-w-[700px]'>
					{/* Days Header */}
					<div className='grid grid-cols-8 border-b border-slate-200/80 bg-slate-50 text-center text-xs font-semibold text-slate-700 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-300'>
						<div className='p-3 text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80'>
							Time
						</div>
						{DAYS.map((day) => (
							<div
								key={day}
								className='p-3 border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0'>
								{day.slice(0, 3)}
							</div>
						))}
					</div>

					{/* Time Slots Rows */}
					{HOURS.map((hour) => (
						<div
							key={hour}
							className='grid grid-cols-8 border-b border-slate-100 dark:border-slate-800/40 text-xs last:border-b-0'>
							{/* Hour Label */}
							<div className='flex items-center justify-center p-2 text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 font-medium'>
								{`${hour.toString().padStart(2, "0")}:00`}
							</div>

							{/* Day Cells */}
							{DAYS.map((day) => {
								const hourFormatted = `${hour.toString().padStart(2, "0")}:00`;

								// Check if slot exists in availability
								const isBooked = initialSlots.some(
									(s) =>
										s.dayOfWeek === day &&
										s.startTime <= hourFormatted &&
										s.endTime > hourFormatted,
								);

								return (
									<button
										key={`${day}-${hour}`}
										type='button'
										onClick={() => handleCellClick(day, hour)}
										disabled={!isTeacher}
										className={`group relative h-12 border-r border-slate-100 dark:border-slate-800/40 transition-colors last:border-r-0 ${
											isBooked
												? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold"
												: "hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
										}`}>
										{isBooked ? (
											<span className='flex items-center justify-center gap-1 text-[10px]'>
												<Clock size={12} /> Available
											</span>
										) : (
											isTeacher && (
												<span className='hidden group-hover:flex items-center justify-center gap-1 text-[10px] text-blue-500'>
													<Plus size={12} /> Add
												</span>
											)
										)}
									</button>
								);
							})}
						</div>
					))}
				</div>
			</div>

			{/* MODAL */}
			<SetAvailabilityModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				initialSlot={selectedSlot}
			/>
		</div>
	);
};
export default ScheduleCalendar;
