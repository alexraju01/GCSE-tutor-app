"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";

import SetAvailabilityModal from "./SetAvailabilityModal";
import { TimeSlot } from "@utils/actions/availability";

interface ScheduleCalendarModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialSlots?: TimeSlot[];
	token?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

const getMonday = (date: Date): Date => {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);

	d.setDate(diff);
	d.setHours(0, 0, 0, 0);

	return d;
};

const formatDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

const parseTimeString = (time?: string): string => {
	if (!time) return "00:00";

	if (time.includes("T")) {
		const date = new Date(time);

		return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
	}

	return time.slice(0, 5);
};

const ScheduleCalendarModal = ({
	isOpen,
	onClose,
	initialSlots = [],
	token,
}: ScheduleCalendarModalProps) => {
	const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
	const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
	const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>(initialSlots);
	const [selectedSlot, setSelectedSlot] = useState<{
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		date: string;
	} | null>(null);

	useEffect(() => {
		setAvailabilitySlots(initialSlots);
	}, [initialSlots]);

	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, index) => {
			const dayDate = new Date(currentWeekStart);
			dayDate.setDate(currentWeekStart.getDate() + index);
			const today = new Date();
			const isoDate = formatDateKey(dayDate);

			return {
				dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
				fullDayName: dayDate.toLocaleDateString("en-US", { weekday: "long" }),
				dayNumber: dayDate.getDate(),
				isoDate,
				isToday: isoDate === formatDateKey(today),
				rawDate: dayDate,
			};
		});
	}, [currentWeekStart]);

	const weekEnd = new Date(currentWeekStart);

	weekEnd.setDate(currentWeekStart.getDate() + 6);

	const startMonth = currentWeekStart.toLocaleDateString("en-US", { month: "short" });
	const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
	const yearLabel = currentWeekStart.getFullYear();
	const rangeHeaderLabel =
		startMonth === endMonth
			? `${startMonth} ${currentWeekStart.getDate()} – ${weekEnd.getDate()}, ${yearLabel}`
			: `${startMonth} ${currentWeekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${yearLabel}`;

	const handlePreviousWeek = () => {
		const previous = new Date(currentWeekStart);

		previous.setDate(previous.getDate() - 7);

		setCurrentWeekStart(previous);
	};

	const handleNextWeek = () => {
		const next = new Date(currentWeekStart);

		next.setDate(next.getDate() + 7);
		setCurrentWeekStart(next);
	};

	const handleToday = () => {
		setCurrentWeekStart(getMonday(new Date()));
	};

	const handleCellClick = (fullDayName: string, hour: number, isoDate: string, isPast: boolean) => {
		if (isPast) return;
		const startTime = `${String(hour).padStart(2, "0")}:00`;
		const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

		setSelectedSlot({
			dayOfWeek: fullDayName,
			startTime,
			endTime,
			date: isoDate,
		});

		setIsAvailabilityModalOpen(true);
	};

	const handleAvailabilitySuccess = (newSlots: TimeSlot[]) => {
		setAvailabilitySlots((previousSlots) => {
			const combined = [...previousSlots, ...newSlots];

			return combined.filter(
				(slot, index, array) =>
					index ===
					array.findIndex((other) =>
						slot.id && other.id
							? slot.id === other.id
							: slot.date === other.date &&
								slot.startTime === other.startTime &&
								slot.endTime === other.endTime,
					),
			);
		});
	};

	const getActiveAvailability = (day: { isoDate: string }, hour: number) => {
		return availabilitySlots.find((slot) => {
			if (!slot.startTime) return false;

			let slotIsoDate = "";
			let startHour = -1;
			let endHour = -1;

			if (slot.startTime.includes("T")) {
				// Split ISO string directly to prevent timezone offset shifts
				// "2026-08-17T08:00:00.000Z" -> date: "2026-08-17", time: "08:00:00.000Z"
				const [datePart, timePart] = slot.startTime.split("T");
				const [endTimePart] = slot.endTime ? slot.endTime.split("T").slice(1) : ["00:00"];

				slotIsoDate = datePart;
				startHour = parseInt(timePart.split(":")[0], 10);
				endHour = parseInt(endTimePart.split(":")[0], 10);
			} else {
				// Handles local HH:mm string format
				slotIsoDate = slot.date || "";
				startHour = parseInt(slot.startTime.split(":")[0], 10);
				endHour = parseInt(slot.endTime.split(":")[0], 10);
			}

			const matchesDate = slotIsoDate === day.isoDate;
			const matchesTime = hour >= startHour && hour < endHour;

			return matchesDate && matchesTime;
		});
	};
	if (!isOpen) return null;

	const now = new Date();

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs'>
			<div className='flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* HEADER */}

				<div className='flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800'>
					<div>
						<h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>
							Teacher Availability
						</h2>

						<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
							Click an empty time slot to set your teaching availability.
						</p>
					</div>

					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'>
						<X size={20} />
					</button>
				</div>

				{/* NAVIGATION */}

				<div className='flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-1'>
							<button
								type='button'
								onClick={handlePreviousWeek}
								className='rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
								<ChevronLeft size={16} />
							</button>

							<button
								type='button'
								onClick={handleNextWeek}
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

					{/* LEGEND */}

					<div className='hidden items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 sm:flex'>
						<div className='flex items-center gap-1.5'>
							<span className='h-2.5 w-2.5 rounded-full bg-blue-500' />
							<span>Availability Set</span>
						</div>

						<div className='flex items-center gap-1.5'>
							<span className='h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700' />
							<span>Past</span>
						</div>
					</div>
				</div>

				{/* CALENDAR */}

				<div className='flex-1 overflow-auto p-5'>
					<div className='min-w-[800px] overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80'>
						{/* DAY HEADER */}

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
										className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
											day.isToday
												? "bg-blue-600 text-white shadow-xs"
												: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
										}`}>
										{day.dayNumber}
									</span>
								</div>
							))}
						</div>

						{/* HOURS */}

						{HOURS.map((hour) => (
							<div
								key={hour}
								className='grid grid-cols-8 border-b border-slate-100 last:border-b-0 dark:border-slate-800/40'>
								<div className='flex items-center justify-center border-r border-slate-200/80 p-2 text-xs font-medium text-slate-400 dark:border-slate-800/80'>
									{`${String(hour).padStart(2, "0")}:00`}
								</div>

								{weekDays.map((day) => {
									const slotDateTime = new Date(day.rawDate);

									slotDateTime.setHours(hour, 0, 0, 0);

									const isPast = slotDateTime < now;

									const activeAvailability = getActiveAvailability(day, hour);

									const isAvailable = Boolean(activeAvailability);

									return (
										<button
											key={`${day.isoDate}-${hour}`}
											type='button'
											disabled={isPast}
											onClick={() => handleCellClick(day.fullDayName, hour, day.isoDate, isPast)}
											className={`group relative h-14 border-r border-slate-100 transition-all last:border-r-0 dark:border-slate-800/40 ${
												isPast
													? "cursor-not-allowed bg-slate-100/70 text-slate-400 dark:bg-slate-800/20 dark:text-slate-600"
													: isAvailable
														? "bg-blue-500/20 font-semibold text-blue-700 ring-1 ring-inset ring-blue-500/30 dark:bg-blue-500/25 dark:text-blue-300"
														: "hover:bg-blue-50/70 dark:hover:bg-blue-950/30"
											}`}>
											{isPast ? (
												<span className='text-[10px]'>Past</span>
											) : isAvailable ? (
												<span className='flex items-center justify-center gap-1 text-[10px] font-semibold'>
													<Clock size={12} />
													Availability Set
												</span>
											) : (
												<span className='hidden items-center justify-center gap-1 text-[10px] text-blue-500 group-hover:flex'>
													<Plus size={12} />
													Add
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

			{/* SET AVAILABILITY MODAL */}

			<SetAvailabilityModal
				isOpen={isAvailabilityModalOpen}
				onClose={() => setIsAvailabilityModalOpen(false)}
				initialSlot={selectedSlot}
				token={token}
				onSuccess={handleAvailabilitySuccess}
			/>
		</div>
	);
};

export default ScheduleCalendarModal;
