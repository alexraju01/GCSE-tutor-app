"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import SetAvailabilityModal from "./SetAvailabilityModal";
import { TimeSlot } from "@utils/actions/availability";

interface ScheduleCalendarModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialSlots?: TimeSlot[];
	token?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 10); // 10 AM to 9 PM

const getMonday = (d: Date): Date => {
	const date = new Date(d);
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
	date.setDate(diff);
	date.setHours(0, 0, 0, 0);
	return date;
};

const formatDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const ScheduleCalendarModal = ({
	isOpen,
	onClose,
	initialSlots = [],
	token,
}: ScheduleCalendarModalProps) => {
	const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
	const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
	const [selectedSlot, setSelectedSlot] = useState<{
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		date: string;
	} | null>(null);

	console.log("=================", token);

	if (!isOpen) return null;

	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const dayDate = new Date(currentWeekStart);
		dayDate.setDate(currentWeekStart.getDate() + i);

		const todayStr = formatDateKey(new Date());
		const dayStr = formatDateKey(dayDate);

		return {
			dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
			fullDayName: dayDate.toLocaleDateString("en-US", { weekday: "long" }),
			dayNumber: dayDate.getDate(),
			isoDate: dayStr,
			isToday: dayStr === todayStr,
		};
	});

	const weekEnd = new Date(currentWeekStart);
	weekEnd.setDate(currentWeekStart.getDate() + 6);
	const startMonth = currentWeekStart.toLocaleDateString("en-US", { month: "short" });
	const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
	const yearLabel = currentWeekStart.getFullYear();

	const rangeHeaderLabel =
		startMonth === endMonth
			? `${startMonth} ${currentWeekStart.getDate()} – ${weekEnd.getDate()}, ${yearLabel}`
			: `${startMonth} ${currentWeekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${yearLabel}`;

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
		const startTime = `${hour.toString().padStart(2, "0")}:00`;
		const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

		setSelectedSlot({
			dayOfWeek: fullDayName,
			startTime,
			endTime,
			date: isoDate,
		});
		setIsSlotModalOpen(true);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs'>
			<div className='flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* MODAL HEADER */}
				<div className='flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800'>
					<div>
						<h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>
							Interactive Availability Calendar
						</h2>
						<p className='text-xs text-slate-500 dark:text-slate-400'>
							Click any hour cell on the grid to add or update your teaching availability.
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'>
						<X size={20} />
					</button>
				</div>

				{/* WEEK NAVIGATION BAR */}
				<div className='flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-1'>
							<button
								type='button'
								onClick={handlePrevWeek}
								title='Previous Week'
								className='rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
								<ChevronLeft size={16} />
							</button>
							<button
								type='button'
								onClick={handleNextWeek}
								title='Next Week'
								className='rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
								<ChevronRight size={16} />
							</button>
						</div>

						<button
							type='button'
							onClick={handleToday}
							className='rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'>
							Today
						</button>

						<span className='ml-2 text-sm font-bold text-slate-800 dark:text-slate-100'>
							{rangeHeaderLabel}
						</span>
					</div>
				</div>

				{/* CALENDAR BODY */}
				<div className='flex-1 overflow-y-auto p-5'>
					<div className='overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80'>
						{/* WEEK HEADER */}
						<div className='grid grid-cols-8 border-b border-slate-200/80 bg-slate-50 text-center text-xs font-semibold text-slate-700 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-300'>
							<div className='flex items-center justify-center border-r border-slate-200/80 p-3 text-slate-400 dark:border-slate-800/80'>
								Time
							</div>
							{weekDays.map((day) => (
								<div
									key={day.isoDate}
									className='flex flex-col items-center justify-center gap-1 border-r border-slate-200/80 p-2.5 last:border-r-0 dark:border-slate-800/80'>
									<span className='text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400'>
										{day.dayName}
									</span>
									<span
										className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
											day.isToday
												? "bg-blue-600 text-white shadow-xs"
												: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
										}`}>
										{day.dayNumber}
									</span>
								</div>
							))}
						</div>

						{/* HOURLY GRID */}
						{HOURS.map((hour) => (
							<div
								key={hour}
								className='grid grid-cols-8 border-b border-slate-100 text-xs last:border-b-0 dark:border-slate-800/40'>
								<div className='flex items-center justify-center border-r border-slate-200/80 p-2 font-medium text-slate-400 dark:border-slate-800/80'>
									{`${hour.toString().padStart(2, "0")}:00`}
								</div>

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
											className={`group relative h-12 border-r border-slate-100 transition-colors last:border-r-0 dark:border-slate-800/40 ${
												isBooked
													? "bg-blue-500/10 font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
													: "hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
											}`}>
											{isBooked ? (
												<span className='flex items-center justify-center gap-1 text-[10px]'>
													<Clock size={12} /> Active
												</span>
											) : (
												<span className='hidden items-center justify-center gap-1 text-[10px] text-blue-500 group-hover:flex'>
													<Plus size={12} /> Add
												</span>
											)}
										</button>
									);
								})}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* NESTED FORM MODAL WITH TOKEN */}
			<SetAvailabilityModal
				isOpen={isSlotModalOpen}
				onClose={() => setIsSlotModalOpen(false)}
				initialSlot={selectedSlot}
				token={token}
			/>
		</div>
	);
};

export default ScheduleCalendarModal;
