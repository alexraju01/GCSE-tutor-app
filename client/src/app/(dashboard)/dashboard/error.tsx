"use client";

import { useEffect } from "react";

const Error = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
	useEffect(() => {
		console.error("Route error caught:", error);
	}, [error]);

	return (
		<div className='flex flex-1 flex-col items-center justify-center p-6 text-center'>
			<h2 className='text-xl font-bold'>Failed to load content</h2>
			<p className='mt-2 text-sm text-slate-500'>We encountered an error loading this section.</p>
			<button
				onClick={() => reset()}
				className='mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500'>
				Try again
			</button>
		</div>
	);
};
export default Error;
