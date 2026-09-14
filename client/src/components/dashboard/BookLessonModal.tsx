"use client";

import { useEffect, useState, useMemo } from "react";
import {
	Clock,
	Calendar as CalendarIcon,
	X,
	Check,
	ChevronLeft,
	ChevronRight,
	AlertCircle,
} from "lucide-react";
import type { SessionData } from "@/types/auth";

interface RawAvailability {
	id: string;
	teacherId: string;
	startTime: string;
	endTime: string;
}

interface BookLessonModalProps {
	isOpen: boolean;
	onClose: () => void;
	teacherId: string;
	teacherName: string | null;
	hourlyRate: number;
	session: SessionData | null;
}

const BookLessonModal = ({
	isOpen,
	onClose,
	teacherId,
	teacherName,
	hourlyRate,
	session,
}: BookLessonModalProps) => {
	const [slots, setSlots] = useState<RawAvailability[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<RawAvailability | null>(null);
	const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
	const [notes, setNotes] = useState<string>("");

	// Extract access token from the passed session prop
	const token = session?.backendToken;

	// Fetch teacher availability slots
	useEffect(() => {
		if (!isOpen || !teacherId) return;

		const fetchTeacherSlots = async () => {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const res = await fetch(
					`http://localhost:8000/api/v1/teachers/${teacherId}/availabilities`,
					{
						headers: token ? { Authorization: `Bearer ${token}` } : {},
					},
				);
				const result = await res.json();
				const loadedSlots: RawAvailability[] = result.data || [];
				setSlots(loadedSlots);

				// Auto-select first date with availability & align calendar month
				if (loadedSlots.length > 0) {
					const firstSlotDate = new Date(loadedSlots[0].startTime);
					const firstDateKey = firstSlotDate.toISOString().split("T")[0];
					setSelectedDateKey(firstDateKey);
					setCurrentMonth(new Date(firstSlotDate.getFullYear(), firstSlotDate.getMonth(), 1));
				}
			} catch (err) {
				console.error("Failed to load availability slots:", err);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchTeacherSlots();
	}, [isOpen, teacherId, token]);

	// Group slots by Date Key (YYYY-MM-DD)
	const groupedSlots = useMemo(() => {
		const groups: Record<string, RawAvailability[]> = {};

		slots.forEach((slot) => {
			const dateKey = new Date(slot.startTime).toISOString().split("T")[0];
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(slot);
		});

		Object.keys(groups).forEach((key) => {
			groups[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
		});

		return groups;
	}, [slots]);

	// Generate Days Grid for Current Month View
	const calendarDays = useMemo(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();

		const firstDayOfMonth = new Date(year, month, 1);
		const lastDayOfMonth = new Date(year, month + 1, 0);

		let startDayIndex = firstDayOfMonth.getDay() - 1;
		if (startDayIndex === -1) startDayIndex = 6;

		const totalDays = lastDayOfMonth.getDate();
		const daysArr: (Date | null)[] = [];

		for (let i = 0; i < startDayIndex; i++) {
			daysArr.push(null);
		}

		for (let day = 1; day <= totalDays; day++) {
			daysArr.push(new Date(year, month, day));
		}

		return daysArr;
	}, [currentMonth]);

	const handlePrevMonth = () => {
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
	};

	const handleNextMonth = () => {
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
	};

	// Post booking submission with backend bearer token
	const handleConfirmBooking = async () => {
		if (!selectedSlot) return;

		if (!token) {
			setErrorMessage("You must be logged in to book a lesson.");
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const res = await fetch("http://localhost:8000/api/v1/lessons", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					teacherProfileId: teacherId,
					availabilityId: selectedSlot.id,
					startTime: selectedSlot.startTime,
					endTime: selectedSlot.endTime,
					notes: notes || undefined,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Failed to create lesson booking");
			}

			setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
			setSelectedSlot(null);
			setNotes("");
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			console.error("Booking error:", error);
			setErrorMessage(error.message || "Something went wrong while booking.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs'>
			<div className='flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800'>
					<div>
						<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
							Book Lesson with {teacherName || "Teacher"}
						</h2>
						<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
							Select an available date and time slot (£{hourlyRate}/hr).
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors'>
						<X size={18} />
					</button>
				</div>

				{/* Content Body */}
				<div className='flex-1 overflow-y-auto p-5'>
					{errorMessage && (
						<div className='mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'>
							<AlertCircle size={16} className='shrink-0' />
							<span>{errorMessage}</span>
						</div>
					)}

					{isLoading ? (
						<div className='py-16 text-center text-sm text-slate-500 dark:text-slate-400'>
							Loading availability calendar...
						</div>
					) : slots.length === 0 ? (
						<div className='py-16 text-center text-sm text-slate-500 dark:text-slate-400'>
							No available slots found for this teacher.
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
							{/* Left Column: Visual Calendar Grid Component */}
							<div className='md:col-span-7 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-4'>
								<div className='flex items-center justify-between mb-4'>
									<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
										1. Select Date
									</span>
									<div className='flex items-center gap-2'>
										<span className='text-xs font-bold text-slate-800 dark:text-slate-200'>
											{currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
										</span>
										<div className='flex items-center gap-1'>
											<button
												type='button'
												onClick={handlePrevMonth}
												className='rounded-md p-1 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'>
												<ChevronLeft size={14} />
											</button>
											<button
												type='button'
												onClick={handleNextMonth}
												className='rounded-md p-1 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'>
												<ChevronRight size={14} />
											</button>
										</div>
									</div>
								</div>

								{/* Days of Week Header */}
								<div className='grid grid-cols-7 gap-1 text-center mb-1'>
									{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
										<span key={day} className='text-[10px] font-semibold text-slate-400 uppercase'>
											{day}
										</span>
									))}
								</div>

								{/* Calendar Days Grid */}
								<div className='grid grid-cols-7 gap-1'>
									{calendarDays.map((date, idx) => {
										if (!date) {
											return <div key={`empty-${idx}`} className='h-9 w-full' />;
										}

										const dateKey = date.toISOString().split("T")[0];
										const hasAvailability = Boolean(groupedSlots[dateKey]);
										const isSelected = selectedDateKey === dateKey;

										return (
											<button
												key={idx}
												type='button'
												disabled={!hasAvailability}
												onClick={() => {
													setSelectedDateKey(dateKey);
													setSelectedSlot(null);
												}}
												className={`h-9 w-full rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
													!hasAvailability
														? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50"
														: isSelected
															? "bg-blue-600 text-white font-bold shadow-xs cursor-pointer"
															: "bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold cursor-pointer"
												}`}>
												<span>{date.getDate()}</span>
												{hasAvailability && (
													<span
														className={`h-1 w-1 rounded-full mt-0.5 ${
															isSelected ? "bg-white" : "bg-blue-600 dark:bg-blue-400"
														}`}
													/>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Right Column: Available Time Slots */}
							<div className='md:col-span-5 flex flex-col justify-between space-y-4'>
								<div>
									<span className='block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3'>
										2. Select Time Slot
									</span>

									{selectedDateKey && groupedSlots[selectedDateKey] ? (
										<div className='space-y-2 max-h-[220px] overflow-y-auto pr-1'>
											{groupedSlots[selectedDateKey].map((slot) => {
												const isSelected = selectedSlot?.id === slot.id;
												const start = new Date(slot.startTime);
												const end = new Date(slot.endTime);

												const startTimeFormatted = start.toLocaleTimeString("en-GB", {
													hour: "2-digit",
													minute: "2-digit",
												});

												const endTimeFormatted = end.toLocaleTimeString("en-GB", {
													hour: "2-digit",
													minute: "2-digit",
												});

												return (
													<button
														key={slot.id}
														type='button'
														onClick={() => setSelectedSlot(slot)}
														className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
															isSelected
																? "border-blue-600 bg-blue-600 text-white shadow-xs font-semibold"
																: "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
														}`}>
														<div className='flex items-center gap-2'>
															<Clock
																size={14}
																className={isSelected ? "text-white" : "text-slate-400"}
															/>
															<span>
																{startTimeFormatted} - {endTimeFormatted}
															</span>
														</div>
														{isSelected && <Check size={14} className='text-white shrink-0' />}
													</button>
												);
											})}
										</div>
									) : (
										<p className='text-xs text-slate-400 py-4'>
											Select a highlighted date to view time slots.
										</p>
									)}
								</div>

								{/* Optional Notes Input */}
								{selectedSlot && (
									<div className='pt-2 border-t border-slate-100 dark:border-slate-800'>
										<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
											Lesson Notes (Optional)
										</label>
										<textarea
											rows={2}
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											placeholder='Add topics or requests for the session...'
											className='w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600'
										/>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='border-t border-slate-100 p-4 dark:border-slate-800 flex items-center justify-end gap-3'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors'>
						Cancel
					</button>
					<button
						type='button'
						disabled={!selectedSlot || isSubmitting}
						onClick={handleConfirmBooking}
						className='px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer'>
						{isSubmitting ? "Booking..." : "Confirm Booking"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default BookLessonModal;
