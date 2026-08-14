"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import SetAvailabilityModal from "./SetAvailabilityModal";
import { TimeSlot } from "@utils/actions/availability";

interface ScheduleCalendarProps {
	isTeacher: boolean;
	initialSlots?: TimeSlot[];
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM (8:00 to 19:00)

// Helper: Get Monday of a given date's week
const getMonday = (d: Date): Date => {
	const date = new Date(d);
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
	date.setDate(diff);
	date.setHours(0, 0, 0, 0);
	return date;
};

// Helper: Format Date to YYYY-MM-DD
const formatDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const ScheduleCalendar = ({ isTeacher, initialSlots = [] }: ScheduleCalendarProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
	const [selectedSlot, setSelectedSlot] = useState<{
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		date: string;
	} | null>(null);

	// Generate 7 days for the currently selected week
	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const dayDate = new Date(currentWeekStart);
		dayDate.setDate(currentWeekStart.getDate() + i);

		const todayStr = formatDateKey(new Date());
		const dayStr = formatDateKey(dayDate);

		return {
			dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }), // e.g., "Mon"
			fullDayName: dayDate.toLocaleDateString("en-US", { weekday: "long" }), // e.g., "Monday"
			dayNumber: dayDate.getDate(), // e.g., 17 or 24
			monthName: dayDate.toLocaleDateString("en-US", { month: "short" }), // e.g., "Aug"
			isoDate: dayStr, // e.g., "2026-08-17"
			isToday: dayStr === todayStr,
		};
	});

	// Calculate Header Date Range Label (e.g., "Aug 17 – Aug 23, 2026")
	const weekEnd = new Date(currentWeekStart);
	weekEnd.setDate(currentWeekStart.getDate() + 6);

	const startMonth = currentWeekStart.toLocaleDateString("en-US", { month: "short" });
	const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
	const yearLabel = currentWeekStart.getFullYear();

	const rangeHeaderLabel =
		startMonth === endMonth
			? `${startMonth} ${currentWeekStart.getDate()} – ${weekEnd.getDate()}, ${yearLabel}`
			: `${startMonth} ${currentWeekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${yearLabel}`;

	// Week Navigation Handlers (Navigates indefinitely into past/future)
	const handlePrevWeek = () => {
		const prev = new Date(currentWeekStart);
		prev.setDate(prev.getDate() - 7);
		setCurrentWeekStart(prev);
	};

	const handleNextWeek = () => {
		const next = new Date(currentWeekStart);
		next.setDate(next.getDate() + 7);
		setCurrentWeekStart(next);
	};

	const handleToday = () => {
		setCurrentWeekStart(getMonday(new Date()));
	};

	const handleCellClick = (fullDayName: string, hour: number, isoDate: string) => {
		if (!isTeacher) return;

		const startTime = `${hour.toString().padStart(2, "0")}:00`;
		const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

		setSelectedSlot({
			dayOfWeek: fullDayName,
			startTime,
			endTime,
			date: isoDate,
		});
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
						onClick={() => {
							setSelectedSlot(null);
							setIsModalOpen(true);
						}}
						className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-[0.98]'>
						<Plus size={16} />
						Set Availability
					</button>
				)}
			</div>

			{/* CALENDAR CONTAINER */}
			<div className='overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
				{/* WEEK NAVIGATION BAR */}
				<div className='flex items-center justify-between border-b border-slate-200/80 p-4 dark:border-slate-800/80'>
					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-1'>
							<button
								type='button'
								onClick={handlePrevWeek}
								title='Previous Week'
								className='rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
								<ChevronLeft size={16} />
							</button>
							<button
								type='button'
								onClick={handleNextWeek}
								title='Next Week'
								className='rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
								<ChevronRight size={16} />
							</button>
						</div>

						<button
							type='button'
							onClick={handleToday}
							className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'>
							Today
						</button>

						<span className='ml-2 text-sm font-bold text-slate-800 dark:text-slate-100'>
							{rangeHeaderLabel}
						</span>
					</div>

					<span className='text-xs text-slate-400 hidden md:inline'>
						Click any empty slot to set availability
					</span>
				</div>

				{/* CALENDAR GRID */}
				<div className='min-w-[700px]'>
					sdlfkjskldjfkljdfh
					{/* Days Header with Day Names & Exact Date Badges */}
					<div className='grid grid-cols-8 border-b border-slate-200/80 bg-slate-50 text-center text-xs font-semibold text-slate-700 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-300'>
						<div className='flex items-center justify-center border-r border-slate-200/80 p-3 text-slate-400 dark:border-slate-800/80'>
							Timesssssssssssssssssssssssssssssss
						</div>
						{weekDays.map((day) => (
							<div
								key={day.isoDate}
								className='flex flex-col items-center justify-center gap-1 border-r border-slate-200/80 p-2.5 last:border-r-0 dark:border-slate-800/80'>
								{/* 1. Day of the week (e.g. MON) */}
								<span className='text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400'>
									{day.dayName}
								</span>

								{/* 2. Numeric date badge (e.g. 17 for Monday, 18 for Tuesday) */}
								<span
									className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
										day.isToday
											? "bg-blue-600 text-white shadow-xs"
											: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
									}`}>
									{day.dayNumber}
								</span>
							</div>
						))}
					</div>
					{/* Time Slots Rows */}
					{HOURS.map((hour) => (
						<div
							key={hour}
							className='grid grid-cols-8 border-b border-slate-100 text-xs last:border-b-0 dark:border-slate-800/40'>
							{/* Hour Label */}
							<div className='flex items-center justify-center border-r border-slate-200/80 p-2 font-medium text-slate-400 dark:border-slate-800/80'>
								{`${hour.toString().padStart(2, "0")}:00`}
							</div>

							{/* Day Cells */}
							{weekDays.map((day) => {
								const hourFormatted = `${hour.toString().padStart(2, "0")}:00`;

								const isBooked = initialSlots.some(
									(s) =>
										s.dayOfWeek === day.fullDayName &&
										s.startTime <= hourFormatted &&
										s.endTime > hourFormatted,
								);

								return (
									<button
										key={`${day.isoDate}-${hour}`}
										type='button'
										onClick={() => handleCellClick(day.fullDayName, hour, day.isoDate)}
										disabled={!isTeacher}
										className={`group relative h-12 border-r border-slate-100 transition-colors last:border-r-0 dark:border-slate-800/40 ${
											isBooked
												? "bg-blue-500/10 font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
												: "hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
										}`}>
										{isBooked ? (
											<span className='flex items-center justify-center gap-1 text-[10px]'>
												<Clock size={12} /> Available
											</span>
										) : (
											isTeacher && (
												<span className='hidden items-center justify-center gap-1 text-[10px] text-blue-500 group-hover:flex'>
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
