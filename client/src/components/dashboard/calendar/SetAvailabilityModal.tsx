"use client";

import { useEffect, useState, useTransition } from "react";

import { Clock, Plus, Trash2, X } from "lucide-react";

import { api } from "@utils/api";
import { TimeSlot } from "@utils/actions/availability";

export interface AvailabilityPayloadItem {
	startTime: string;
	durationInMinutes: number;
}

interface SetAvailabilityModalProps {
	isOpen: boolean;
	onClose: () => void;
	token?: string;

	initialSlot?: {
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		date?: string;
	} | null;

	onSuccess?: (newSlots: TimeSlot[]) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface EditableSlot {
	date: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
}

const getNextDateForDay = (dayName: string, baseDateStr?: string): string => {
	const dayIndex = DAYS.indexOf(dayName);

	const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();

	const currentDayIndex = (base.getDay() + 6) % 7;

	const distance = dayIndex - currentDayIndex;

	const targetDate = new Date(base);

	targetDate.setDate(base.getDate() + distance);

	const yyyy = targetDate.getFullYear();

	const mm = String(targetDate.getMonth() + 1).padStart(2, "0");

	const dd = String(targetDate.getDate()).padStart(2, "0");

	return `${yyyy}-${mm}-${dd}`;
};

const calculateDuration = (start: string, end: string): number => {
	const [startHours, startMinutes] = start.split(":").map(Number);

	const [endHours, endMinutes] = end.split(":").map(Number);

	const startTotal = startHours * 60 + startMinutes;

	const endTotal = endHours * 60 + endMinutes;

	const duration = endTotal - startTotal;

	return duration > 0 ? duration : 60;
};

const SetAvailabilityModal = ({
	isOpen,
	onClose,
	token,
	initialSlot,
	onSuccess,
}: SetAvailabilityModalProps) => {
	const [isPending, startTransition] = useTransition();

	const [slots, setSlots] = useState<EditableSlot[]>([
		{
			date: getNextDateForDay("Monday"),
			dayOfWeek: "Monday",
			startTime: "09:00",
			endTime: "10:00",
		},
	]);

	const [error, setError] = useState<string | null>(null);

	/*
	|--------------------------------------------------------------------------
	| Reset when opened / selected slot changes
	|--------------------------------------------------------------------------
	*/

	useEffect(() => {
		if (!isOpen) return;

		if (initialSlot) {
			const slotDate = initialSlot.date || getNextDateForDay(initialSlot.dayOfWeek);

			setSlots([
				{
					date: slotDate,
					dayOfWeek: initialSlot.dayOfWeek,
					startTime: initialSlot.startTime,
					endTime: initialSlot.endTime,
				},
			]);
		} else {
			setSlots([
				{
					date: getNextDateForDay("Monday"),
					dayOfWeek: "Monday",
					startTime: "09:00",
					endTime: "10:00",
				},
			]);
		}

		setError(null);
	}, [initialSlot, isOpen]);

	if (!isOpen) return null;

	/*
	|--------------------------------------------------------------------------
	| Add
	|--------------------------------------------------------------------------
	*/

	const handleAddSlot = () => {
		setSlots((previous) => [
			...previous,
			{
				date: getNextDateForDay("Monday"),
				dayOfWeek: "Monday",
				startTime: "09:00",
				endTime: "10:00",
			},
		]);
	};

	/*
	|--------------------------------------------------------------------------
	| Remove
	|--------------------------------------------------------------------------
	*/

	const handleRemoveSlot = (index: number) => {
		setSlots((previous) => previous.filter((_, i) => i !== index));
	};

	/*
	|--------------------------------------------------------------------------
	| Change
	|--------------------------------------------------------------------------
	*/

	const handleSlotChange = (index: number, field: keyof EditableSlot, value: string) => {
		setSlots((previous) =>
			previous.map((slot, slotIndex) => {
				if (slotIndex !== index) {
					return slot;
				}

				const updated = {
					...slot,
					[field]: value,
				};

				if (field === "dayOfWeek") {
					updated.date = getNextDateForDay(value, slot.date);
				}

				return updated;
			}),
		);
	};

	/*
	|--------------------------------------------------------------------------
	| Submit
	|--------------------------------------------------------------------------
	*/

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		setError(null);

		if (slots.length === 0) {
			setError("Please add at least one availability slot.");

			return;
		}

		for (const slot of slots) {
			if (!slot.date || !slot.startTime || !slot.endTime) {
				setError("Please complete all availability fields.");

				return;
			}

			if (calculateDuration(slot.startTime, slot.endTime) <= 0) {
				setError("End time must be after start time.");

				return;
			}
		}

		startTransition(async () => {
			try {
				/*
				 * Convert each local date/time into
				 * the ISO format expected by the API.
				 */
				const payloads: AvailabilityPayloadItem[] = slots.map((slot) => {
					const [hours, minutes] = slot.startTime.split(":").map(Number);

					const [year, month, day] = slot.date.split("-").map(Number);

					const isoStartTime = new Date(
						Date.UTC(year, month - 1, day, hours, minutes),
					).toISOString();

					return {
						startTime: isoStartTime,

						durationInMinutes: calculateDuration(slot.startTime, slot.endTime),
					};
				});

				/*
				 * Save all slots.
				 */
				const responses = await Promise.all(
					payloads.map((payload) => api.availability.create(payload, token)),
				);

				/*
				 * Merge the API response with the
				 * original UI slot.
				 *
				 * This is important because the
				 * calendar needs:
				 *
				 * date
				 * dayOfWeek
				 * startTime
				 * endTime
				 */
				const createdTimeSlots: TimeSlot[] = responses.map((response, index) => {
					const rawSlot = slots[index];

					return {
						...response,

						id: response?.id || `${rawSlot.date}-${rawSlot.startTime}`,

						date: rawSlot.date,

						dayOfWeek: rawSlot.dayOfWeek,

						startTime: rawSlot.startTime,

						endTime: rawSlot.endTime,
					} as TimeSlot;
				});

				/*
				 * Immediately update calendar.
				 */
				onSuccess?.(createdTimeSlots);

				onClose();
			} catch (err: unknown) {
				console.error("Availability submission error:", err);

				const message = err instanceof Error ? err.message : "Failed to save availability slot.";

				setError(message);
			}
		});
	};

	return (
		<div className='fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs'>
			<div className='w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* HEADER */}

				<div className='flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800'>
					<div>
						<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
							Set Teaching Availability
						</h2>

						<p className='text-xs text-slate-500 dark:text-slate-400'>
							Specify when students can book lessons with you.
						</p>
					</div>

					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'>
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='mt-4 space-y-4'>
					{/* ERROR */}

					{error && (
						<div className='rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400'>
							{error}
						</div>
					)}

					{/* SLOTS */}

					<div className='max-h-60 space-y-3 overflow-y-auto pr-1'>
						{slots.map((slot, index) => (
							<div
								key={index}
								className='rounded-xl border border-slate-200/80 p-3 dark:border-slate-800'>
								<div className='flex items-center gap-2'>
									{/* DAY */}

									<select
										value={slot.dayOfWeek}
										onChange={(event) => handleSlotChange(index, "dayOfWeek", event.target.value)}
										className='flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'>
										{DAYS.map((day) => (
											<option key={day} value={day}>
												{day}
											</option>
										))}
									</select>

									{/* REMOVE */}

									{slots.length > 1 && (
										<button
											type='button'
											onClick={() => handleRemoveSlot(index)}
											className='rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20'>
											<Trash2 size={16} />
										</button>
									)}
								</div>

								{/* DATE */}

								<div className='mt-2'>
									<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
										Date
									</label>

									<input
										type='date'
										value={slot.date}
										onChange={(event) => handleSlotChange(index, "date", event.target.value)}
										className='w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
									/>
								</div>

								{/* TIMES */}

								<div className='mt-2 flex items-center gap-2'>
									<div className='flex-1'>
										<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
											Start
										</label>

										<div className='flex items-center gap-1'>
											<Clock size={14} className='text-slate-400' />

											<input
												type='time'
												value={slot.startTime}
												onChange={(event) =>
													handleSlotChange(index, "startTime", event.target.value)
												}
												className='w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
											/>
										</div>
									</div>

									<span className='mt-5 text-xs text-slate-400'>to</span>

									<div className='flex-1'>
										<label className='mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
											End
										</label>

										<input
											type='time'
											value={slot.endTime}
											onChange={(event) => handleSlotChange(index, "endTime", event.target.value)}
											className='w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
										/>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* ADD */}

					<button
						type='button'
						onClick={handleAddSlot}
						className='inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50'>
						<Plus size={14} />
						Add Another Slot
					</button>

					{/* FOOTER */}

					<div className='flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg border cursor-pointer border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
							Cancel
						</button>

						<button
							type='submit'
							disabled={isPending}
							className='rounded-lg bg-blue-600 cursor-pointer px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50'>
							{isPending ? "Saving..." : "Save Availability"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SetAvailabilityModal;
