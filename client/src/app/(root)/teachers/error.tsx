"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

const Error = ({ error, reset }: ErrorProps) => {
	useEffect(() => {
		console.error("Teachers Page Error:", error);
	}, [error]);

	return (
		<div className='flex-1 flex items-center justify-center px-6 py-12 bg-slate-50'>
			<div className='max-w-lg w-full bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xl shadow-slate-200/50 relative overflow-hidden'>
				{/* Subtle Top Accent Bar */}
				<div className='absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600' />

				{/* Icon Header */}
				<div className='mx-auto w-16 h-16 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm'>
					<AlertCircle size={32} strokeWidth={2} />
				</div>

				{/* Content Section */}
				<h1 className='text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl'>
					Unable to Load Tutors
				</h1>

				<p className='mt-3 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto'>
					We couldn&apos;t connect to our services to retrieve the teacher directory. This might be
					a temporary network hiccup or server maintenance.
				</p>

				{/* Technical Digest/Error Detail */}
				{error.digest && (
					<div className='mt-4 inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-md'>
						<p className='text-[11px] font-mono text-slate-500'>Error ID: {error.digest}</p>
					</div>
				)}

				{/* Action Buttons */}
				<div className='mt-8 flex flex-col sm:flex-row items-center justify-center gap-3'>
					<button
						onClick={() => reset()}
						className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 active:scale-98 shadow-lg shadow-blue-600/20 transition-all cursor-pointer'>
						<RefreshCw size={18} />
						Try Again
					</button>

					<Link
						href='/'
						className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-slate-200/80 active:scale-98 transition-all'>
						<ArrowLeft size={18} />
						Back to Home
					</Link>
				</div>
			</div>
		</div>
	);
};

export default Error;
