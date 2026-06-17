import Navbar from "@components/Navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='min-h-screen flex flex-col'>
			<Navbar />
			<main className='flex-1 flex flex-col'>{children}</main>
			<footer className='shrink-0 bg-white border-t border-slate-200 py-6 px-6 text-center text-sm text-slate-500'>
				&copy; {new Date().getFullYear()} GCSE Ace. All rights reserved.
			</footer>
		</div>
	);
}
