"use client";

import { Clock, User } from "lucide-react";
import Image from "next/image";

interface BookingRequestCardProps {
	request: BookingRequest;
}

const BookingRequestCard = ({ request }: BookingRequestCardProps) => {
	const handleAccept = async () => {
		// Action handler logic here
	};

	const handleDecline = async () => {
		// Action handler logic here
	};

	return (
		<div className='space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/50'>
			<div className='flex items-start justify-between gap-2'>
				<div className='flex items-center gap-3'>
					<div className='relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500'>
						{request.studentImage ? (
							<Image
								src={request.studentImage}
								alt={request.student}
								fill
								className='object-cover'
							/>
						) : (
							<User size={20} className='mt-1' />
						)}
					</div>

					<div>
						<h3 className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
							{request.student}
						</h3>
						<p className='text-xs font-medium text-blue-600 dark:text-blue-400'>
							{request.subject}
						</p>
					</div>
				</div>

				<span className='shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
					{request.duration}
				</span>
			</div>

			<div className='flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/40 dark:text-slate-300'>
				<span className='font-medium'>{request.date}</span>
				<span className='flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100'>
					<Clock size={12} className='text-slate-400' />
					{request.timeSlot}
				</span>
			</div>

			<div className='flex items-center gap-2 pt-1'>
				<button
					onClick={handleAccept}
					className='flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.98]'>
					Accept
				</button>
				<button
					onClick={handleDecline}
					className='flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 active:scale-[0.98]'>
					Decline
				</button>
			</div>
		</div>
	);
};

export default BookingRequestCard;
