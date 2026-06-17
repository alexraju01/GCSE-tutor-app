"use client";

import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@constants/routes";

interface AvatarProps {
	user: any;
	setIsOpen: (open: boolean) => void;
}

export default function Avatar({ user, setIsOpen }: AvatarProps) {
	const formattedRole = user?.role === "TEACHER" ? "Teacher Account" : "Student Account";

	const dashboardLink =
		user?.role === "TEACHER" ? ROUTES.DASHBOARD.TEACHER : ROUTES.DASHBOARD.STUDENT;

	const handleFakeSignOut = () => {
		setIsOpen(false);
		alert("Mock action: Logging out user and redirecting to homepage...");
		window.location.href = "/";
	};

	return (
		<>
			<div className='fixed inset-0 z-10 cursor-default' onClick={() => setIsOpen(false)}></div>

			<div className='absolute right-0 top-full mt-3 w-60 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden transform origin-top-right transition-all duration-200'>
				<div className='px-4 py-3.5 bg-slate-50 border-b border-slate-100'>
					<p className='text-sm font-bold text-slate-900 truncate'>
						{user?.name || "GCSE Ace User"}
					</p>
					<p className='text-xs text-slate-500 truncate font-medium mt-0.5'>{user?.email}</p>

					<div className='mt-2 inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md'>
						<span className='h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse' />
						{formattedRole}
					</div>
				</div>

				<div className='p-1.5 space-y-0.5'>
					<Link
						href={dashboardLink}
						onClick={() => setIsOpen(false)}
						className='w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 font-medium rounded-lg transition-colors group'>
						<LayoutDashboard
							size={16}
							className='text-slate-400 group-hover:text-blue-600 transition-colors'
						/>
						Go to Dashboard
					</Link>

					<hr className='border-slate-100 my-1 mx-1' />

					<button
						onClick={handleFakeSignOut}
						className='w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors group'>
						<LogOut size={16} className='text-red-400 group-hover:text-red-600 transition-colors' />
						Logout
					</button>
				</div>
			</div>
		</>
	);
}
