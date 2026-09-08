"use client";

import { useEffect, useState } from "react";
import { Clock, Calendar, X, Check } from "lucide-react";

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
	teacherName: string;
	hourlyRate: number;
}

const BookLessonModal = ({
	isOpen,
	onClose,
	teacherId,
	teacherName,
	hourlyRate,
}: BookLessonModalProps) => {
	const [slots, setSlots] = useState<RawAvailability[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedSlot, setSelectedSlot] = useState<RawAvailability | null>(null);

	useEffect(() => {
		if (!isOpen || !teacherId) return;

		const fetchTeacherSlots = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`http://localhost:8000/api/v1/availability/${teacherId}`);
				const result = await res.json();

				// Extract array from result.data returned by Express
				setSlots(result.data || []);
			} catch (err) {
				console.error("Failed to load availability slots:", err);
			} finally {
				setIsLoading(false);
			}
		};

		void fetchTeacherSlots();
	}, [isOpen, teacherId]);

	if (!isOpen) return null;

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className='py-12 text-center text-sm text-slate-500'>Loading available slots...</div>
			);
		}

		if (slots.length === 0) {
			return (
				<div className='py-12 text-center text-sm text-slate-500'>
					No available slots found for this teacher.
				</div>
			);
		}

		return slots.map((slot) => {
			const isSelected = selectedSlot?.id === slot.id;

			const start = new Date(slot.startTime);
			const end = new Date(slot.endTime);

			const dateLabel = start.toLocaleDateString("en-GB", {
				weekday: "short",
				day: "numeric",
				month: "short",
			});

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
					className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
						isSelected
							? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:text-blue-200"
							: "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
					}`}>
					<div className='flex items-center gap-3'>
						<Calendar size={18} className='text-blue-600 shrink-0' />
						<div>
							<p className='text-sm font-semibold'>{dateLabel}</p>
							<p className='text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5'>
								<Clock size={12} />
								{startTimeFormatted} - {endTimeFormatted}
							</p>
						</div>
					</div>
					{isSelected && <Check size={18} className='text-blue-600 shrink-0' />}
				</button>
			);
		});
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs'>
			<div className='flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800'>
					<div>
						<h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>
							Book Lesson with {teacherName}
						</h2>
						<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
							Select an available time slot to schedule your session (£{hourlyRate}/hr).
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer'>
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto p-5 space-y-3'>{renderContent()}</div>

				{/* Footer */}
				<div className='border-t border-slate-100 p-4 dark:border-slate-800 flex items-center justify-end gap-3'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer'>
						Cancel
					</button>
					<button
						type='button'
						disabled={!selectedSlot}
						className='px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer'>
						Confirm Booking
					</button>
				</div>
			</div>
		</div>
	);
};

export default BookLessonModal;
