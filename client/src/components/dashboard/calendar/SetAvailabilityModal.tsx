"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, Plus, Trash2, X } from "lucide-react";
import { api } from "@utils/api";

export interface AvailabilityPayloadItem {
	startTime: string; // ISO 8601 string
	durationInMinutes: number;
}

interface SetAvailabilityModalProps {
	isOpen: boolean;
	onClose: () => void;
	token?: string; // Passed from parent page/session context
	initialSlot?: {
		dayOfWeek: string;
		startTime: string; // e.g. "15:00"
		endTime: string; // e.g. "16:00"
		date?: string; // e.g. "2026-08-17"
	} | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
	const [startH, startM] = start.split(":").map(Number);
	const [endH, endM] = end.split(":").map(Number);
	const diff = endH * 60 + endM - (startH * 60 + startM);
	return diff > 0 ? diff : 60;
};

const SetAvailabilityModal = ({
	isOpen,
	onClose,
	token,
	initialSlot,
}: SetAvailabilityModalProps) => {
	const [isPending, startTransition] = useTransition();
	const [slots, setSlots] = useState([
		{
			date: getNextDateForDay("Monday"),
			dayOfWeek: "Monday",
			startTime: "09:00",
			endTime: "10:00",
		},
	]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
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
	}, [initialSlot, isOpen]);

	if (!isOpen) return null;

	const handleAddSlot = () => {
		setSlots((prev) => [
			...prev,
			{
				date: getNextDateForDay("Monday"),
				dayOfWeek: "Monday",
				startTime: "09:00",
				endTime: "10:00",
			},
		]);
	};

	const handleRemoveSlot = (index: number) => {
		setSlots((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSlotChange = (index: number, field: string, value: string) => {
		setSlots((prev) =>
			prev.map((slot, i) => {
				if (i !== index) return slot;
				const updated = { ...slot, [field]: value };
				if (field === "dayOfWeek") {
					updated.date = getNextDateForDay(value, slot.date);
				}
				return updated;
			}),
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			try {
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

				// Submit payloads with the token
				await Promise.all(payloads.map((payload) => api.availability.create(payload, token)));

				onClose();
			} catch (err: unknown) {
				console.error("Availability submission error:", err);
				const message = err instanceof Error ? err.message : "Failed to save availability slot.";
				setError(message);
			}
		});
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs'>
			<div className='w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* MODAL HEADER */}
				<div className='flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800'>
					<div>
						<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>
							Set Teaching Availability
						</h2>
						<p className='text-xs text-slate-500 dark:text-slate-400'>
							Specify times students can book lessons with you.
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
					{error && (
						<div className='rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400'>
							{error}
						</div>
					)}

					{/* TIME SLOTS LIST */}
					<div className='max-h-60 space-y-3 overflow-y-auto pr-1'>
						{slots.map((slot, index) => (
							<div
								key={index}
								className='flex items-center gap-2 rounded-xl border border-slate-200/80 p-3 dark:border-slate-800'>
								{/* Day Select */}
								<select
									value={slot.dayOfWeek}
									onChange={(e) => handleSlotChange(index, "dayOfWeek", e.target.value)}
									className='flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'>
									{DAYS.map((day) => (
										<option key={day} value={day}>
											{day}
										</option>
									))}
								</select>

								{/* Start Time */}
								<div className='flex items-center gap-1'>
									<Clock size={14} className='text-slate-400' />
									<input
										type='time'
										value={slot.startTime}
										onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
										className='rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
									/>
								</div>

								<span className='text-xs text-slate-400'>to</span>

								{/* End Time */}
								<input
									type='time'
									value={slot.endTime}
									onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
									className='rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
								/>

								{/* Remove Button */}
								{slots.length > 1 && (
									<button
										type='button'
										onClick={() => handleRemoveSlot(index)}
										className='rounded-lg p-1.5 text-slate-400 hover:text-red-500'>
										<Trash2 size={16} />
									</button>
								)}
							</div>
						))}
					</div>

					<button
						type='button'
						onClick={handleAddSlot}
						className='inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50'>
						<Plus size={14} /> Add Another Slot
					</button>

					{/* FOOTER ACTIONS */}
					<div className='flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending}
							className='rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50'>
							{isPending ? "Saving..." : "Save Availability"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SetAvailabilityModal;
