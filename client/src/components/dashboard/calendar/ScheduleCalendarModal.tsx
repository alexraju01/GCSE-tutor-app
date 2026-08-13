"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import SetAvailabilityModal from "./SetAvailabilityModal";
import { TimeSlot } from "@utils/actions/";

interface ScheduleCalendarModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialSlots?: TimeSlot[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function ScheduleCalendarModal({
	isOpen,
	onClose,
	initialSlots = [],
}: ScheduleCalendarModalProps) {
	const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

	if (!isOpen) return null;

	const handleCellClick = (day: string, hour: number) => {
		const startTime = `${hour.toString().padStart(2, "0")}:00`;
		const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

		setSelectedSlot({
			dayOfWeek: day,
			startTime,
			endTime,
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

				{/* CALENDAR BODY */}
				<div className='flex-1 overflow-y-auto p-5'>
					<div className='overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80'>
						{/* WEEK HEADER */}
						<div className='grid grid-cols-8 border-b border-slate-200/80 bg-slate-50 text-center text-xs font-semibold text-slate-700 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-300'>
							<div className='border-r border-slate-200/80 p-3 text-slate-400 dark:border-slate-800/80'>
								Time
							</div>
							{DAYS.map((day) => (
								<div
									key={day}
									className='border-r border-slate-200/80 p-3 last:border-r-0 dark:border-slate-800/80'>
									{day.slice(0, 3)}
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

								{DAYS.map((day) => {
									const hourFormatted = `${hour.toString().padStart(2, "0")}:00`;
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

			{/* NESTED FORM MODAL */}
			<SetAvailabilityModal
				isOpen={isSlotModalOpen}
				onClose={() => setIsSlotModalOpen(false)}
				initialSlot={selectedSlot}
			/>
		</div>
	);
}
