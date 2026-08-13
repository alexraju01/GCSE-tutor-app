import { BookingRequestCard } from "./BookingRequestCard";

interface PendingRequestsProps {
	requests?: BookingRequest[];
}

export const PendingRequests = ({ requests = [] }: PendingRequestsProps) => {
	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>Booking Requests</h2>
				<span className='rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400'>
					{requests.length} Pending
				</span>
			</div>

			<div className='space-y-3'>
				{requests.length === 0 ? (
					<div className='rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400'>
						No pending requests.
					</div>
				) : (
					requests.map((req) => <BookingRequestCard key={req.id} request={req} />)
				)}
			</div>
		</div>
	);
};
