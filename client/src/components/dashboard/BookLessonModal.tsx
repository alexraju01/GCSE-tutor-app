"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import { Clock, X, Check, ChevronLeft, ChevronRight, AlertCircle, BookOpen } from "lucide-react";
import type { SessionData } from "@/types/auth";

interface RawAvailability {
	id: string;
	teacherId: string;
	startTime: string;
	endTime: string;
}

interface TeacherProfile {
	id: string;
	subjects?: string[];
}

interface BookLessonModalProps {
	isOpen: boolean;
	onClose: () => void;
	teacherId: string;
	teacherName: string | null;
	hourlyRate: number;
	session: SessionData | null;
	teacherSubjects?: string[];
}

const BookLessonModal = ({
	isOpen,
	onClose,
	teacherId,
	teacherName,
	hourlyRate,
	session,
	teacherSubjects,
}: BookLessonModalProps) => {
	const [slots, setSlots] = useState<RawAvailability[]>([]);
	const [availableSubjects, setAvailableSubjects] = useState<string[]>(teacherSubjects || []);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<RawAvailability | null>(null);
	const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

	// Lesson specific details
	const [subject, setSubject] = useState<string>("");
	const [topic, setTopic] = useState<string>("");
	const [notes, setNotes] = useState<string>("");

	const token = session?.backendToken;

	useEffect(() => {
		if (!isOpen || !teacherId) return;

		const fetchTeacherDetailsAndSlots = async () => {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const headers = token ? { Authorization: `Bearer ${token}` } : {};

				// Fetch slots and teacher profile concurrently if subjects weren't provided as a prop
				const slotsPromise = fetch(
					`http://localhost:8000/api/v1/teachers/${teacherId}/availabilities`,
					{ headers },
				);

				const teacherPromise = !teacherSubjects
					? fetch(`http://localhost:8000/api/v1/teachers/${teacherId}`, { headers })
					: Promise.resolve(null);

				const [slotsRes, teacherRes] = await Promise.all([slotsPromise, teacherPromise]);

				const slotsResult = await slotsRes.json();
				const loadedSlots: RawAvailability[] = slotsResult.data || [];
				setSlots(loadedSlots);

				let fetchedSubjects: string[] = teacherSubjects || [];
				if (teacherRes && teacherRes.ok) {
					const teacherData = await teacherRes.json();
					const profile: TeacherProfile = teacherData.data || teacherData;
					fetchedSubjects = profile.subjects || [];
				}

				setAvailableSubjects(fetchedSubjects);
				if (fetchedSubjects.length > 0) {
					setSubject(fetchedSubjects[0]);
				}

				if (loadedSlots.length > 0) {
					const firstSlotDate = new Date(loadedSlots[0].startTime);
					const firstDateKey = firstSlotDate.toISOString().split("T")[0];
					setSelectedDateKey(firstDateKey);
					setCurrentMonth(new Date(firstSlotDate.getFullYear(), firstSlotDate.getMonth(), 1));
				}
			} catch (err) {
				console.error("Failed to load availability slots or teacher info:", err);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchTeacherDetailsAndSlots();
	}, [isOpen, teacherId, token, teacherSubjects]);

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

	const handleConfirmBooking = async () => {
		if (!selectedSlot) return;

		if (!token) {
			setErrorMessage("You must be logged in to book a lesson.");
			return;
		}

		if (!subject) {
			setErrorMessage("Please select a subject for the lesson.");
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
					subject,
					topic: topic || undefined,
					notes: notes || undefined,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Failed to create lesson booking");
			}

			setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
			setSelectedSlot(null);
			setTopic("");
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
			<div className='flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800'>
					<div>
						<h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>
							Book Lesson with {teacherName || "Teacher"}
						</h2>
						<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
							Select an available date, time slot, and lesson subject (£{hourlyRate}/hr).
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors'>
						<X size={20} />
					</button>
				</div>

				{/* Content Body */}
				<div className='flex-1 overflow-y-auto p-6'>
					{errorMessage && (
						<div className='mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'>
							<AlertCircle size={16} className='shrink-0' />
							<span>{errorMessage}</span>
						</div>
					)}

					{isLoading ? (
						<div className='py-20 text-center text-sm text-slate-500 dark:text-slate-400'>
							Loading availability calendar...
						</div>
					) : slots.length === 0 ? (
						<div className='py-20 text-center text-sm text-slate-500 dark:text-slate-400'>
							No available slots found for this teacher.
						</div>
					) : (
						<div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
							{/* Left Column: Calendar Grid */}
							<div className='lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-6'>
								<div className='flex items-center justify-between mb-5'>
									<span className='text-xs font-semibold uppercase tracking-wider text-slate-400'>
										1. Select Date
									</span>
									<div className='flex items-center gap-3'>
										<span className='text-sm font-bold text-slate-800 dark:text-slate-200'>
											{currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
										</span>
										<div className='flex items-center gap-1'>
											<button
												type='button'
												onClick={handlePrevMonth}
												className='rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors'>
												<ChevronLeft size={16} />
											</button>
											<button
												type='button'
												onClick={handleNextMonth}
												className='rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors'>
												<ChevronRight size={16} />
											</button>
										</div>
									</div>
								</div>

								{/* Days Header */}
								<div className='grid grid-cols-7 gap-2 text-center mb-2'>
									{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
										<span
											key={day}
											className='text-xs font-semibold text-slate-400 uppercase tracking-wide'>
											{day}
										</span>
									))}
								</div>

								{/* Days Grid */}
								<div className='grid grid-cols-7 gap-2'>
									{calendarDays.map((date, idx) => {
										if (!date) {
											return <div key={`empty-${idx}`} className='h-12 w-full' />;
										}

										const dateKey = date.toISOString().split("T")[0];
										const slotCount = groupedSlots[dateKey]?.length || 0;
										const hasAvailability = slotCount > 0;
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
												className={`h-12 w-full rounded-xl text-xs flex flex-col items-center justify-center relative transition-all ${
													!hasAvailability
														? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40 bg-slate-50/50 dark:bg-slate-900/50"
														: isSelected
															? "bg-blue-600 text-white font-bold shadow-md cursor-pointer scale-[1.02]"
															: "bg-blue-50/80 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold cursor-pointer border border-blue-100/50 dark:border-blue-900/30"
												}`}>
												<span className='text-sm'>{date.getDate()}</span>
												{hasAvailability && (
													<span
														className={`text-[9px] mt-0.5 px-1 rounded-full font-medium ${
															isSelected
																? "bg-white/20 text-white"
																: "text-blue-600 dark:text-blue-400"
														}`}>
														{slotCount} {slotCount === 1 ? "slot" : "slots"}
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Right Column: Time Slot & Subject Selection */}
							<div className='lg:col-span-5 flex flex-col justify-between space-y-5'>
								<div>
									<span className='block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3'>
										2. Select Time Slot
									</span>

									{selectedDateKey && groupedSlots[selectedDateKey] ? (
										<div className='space-y-2 max-h-[180px] overflow-y-auto pr-1'>
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
																: "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-950/50"
														}`}>
														<div className='flex items-center gap-2.5'>
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
										<p className='text-xs text-slate-400 py-3'>
											Select a highlighted date to view time slots.
										</p>
									)}
								</div>

								{/* Lesson Context Inputs */}
								<div className='pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3'>
									<span className='block text-xs font-semibold uppercase tracking-wider text-slate-400'>
										3. Lesson Details
									</span>

									<div>
										<label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
											Subject
										</label>
										<div className='relative'>
											{availableSubjects.length > 0 ? (
												<select
													value={subject}
													onChange={(e: ChangeEvent<HTMLSelectElement>) =>
														setSubject(e.target.value)
													}
													className='w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-8 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600 cursor-pointer'>
													{availableSubjects.map((sub) => (
														<option key={sub} value={sub}>
															{sub}
														</option>
													))}
												</select>
											) : (
												<div className='w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'>
													No subjects listed for this teacher
												</div>
											)}
											<BookOpen
												size={14}
												className='absolute right-3 top-3 text-slate-400 pointer-events-none'
											/>
										</div>
									</div>

									<div>
										<label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
											Topic (Optional)
										</label>
										<input
											type='text'
											value={topic}
											onChange={(e: ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
											placeholder='e.g., Integration by parts, Organic Chemistry'
											className='w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600'
										/>
									</div>

									{selectedSlot && (
										<div>
											<label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
												Additional Notes (Optional)
											</label>
											<textarea
												rows={2}
												value={notes}
												onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
												placeholder='Add requests or details for the session...'
												className='w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600'
											/>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='border-t border-slate-100 p-5 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors'>
						Cancel
					</button>
					<button
						type='button'
						disabled={!selectedSlot || isSubmitting || availableSubjects.length === 0}
						onClick={handleConfirmBooking}
						className='px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer'>
						{isSubmitting ? "Booking..." : "Confirm Booking"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default BookLessonModal;
