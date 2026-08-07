import { auth } from "@auth";
import { LayoutDashboard } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import ActiveLink from "./ActiveLink";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

const Navbar = async () => {
	const session = await auth();
	const user = session?.user;

	const dashboardHref: Route =
		user?.role === "Teacher" ? "/dashboard/teacher" : "/dashboard/student";

	return (
		<header className='sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-colors duration-300 dark:border-slate-800/80 dark:bg-[#0b0f19]/80'>
			<div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
				{/* LEFT SIDE */}
				<div className='flex items-center gap-8'>
					<Logo />
					<nav className='flex items-center gap-6 text-sm font-medium'>
						<ActiveLink href='/teachers'>Teachers</ActiveLink>
					</nav>
				</div>

				{/* RIGHT SIDE */}
				<div className='flex items-center gap-4'>
					{user ? (
						<div className='flex items-center gap-3'>
							<ActiveLink href={dashboardHref}>
								<div className='flex items-center gap-2'>
									<LayoutDashboard size={16} className='opacity-80' />
									<span>Dashboard</span>
								</div>
							</ActiveLink>
							<div className='h-4 w-px bg-slate-200 dark:bg-slate-800' />
							<UserMenu user={user} />
						</div>
					) : (
						<Link
							href='/sign-up'
							className='inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.98]'>
							Get Started
						</Link>
					)}
				</div>
			</div>
		</header>
	);
};

export default Navbar;
