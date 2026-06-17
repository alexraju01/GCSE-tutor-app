"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@constants/routes";
import { Avatar } from "@components";

interface UserMenuProps {
	user: undefined | null;
}

const UserMenu = ({ user }: UserMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);

	if (!user) {
		return (
			<div className='flex items-center px-4'>
				<Link
					href={ROUTES.SIGN_IN}
					className='bg-custom-accent text-white px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity text-sm lg:text-base'>
					Login
				</Link>
			</div>
		);
	}

	// --- 2. Authenticated UI ---
	return (
		<div className='relative flex items-center px-4'>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='flex items-center gap-2 focus:outline-none group'
				aria-expanded={isOpen}>
				<div className='h-10 w-10 rounded-full bg-blue-600 overflow-hidden border-2 border-transparent group-hover:border-custom-accent transition-all flex items-center justify-center'>
					{user.image ? (
						<Image
							src={user.image}
							width={40}
							height={40}
							alt={user.name || "User"}
							className='h-full w-full object-cover'
						/>
					) : (
						<span className='text-sm text-white font-bold'>
							{user.name?.charAt(0).toUpperCase() || "U"}
						</span>
					)}
				</div>
			</button>

			{/* The Avatar component handles the dropdown items/sign out */}
			{isOpen && <Avatar user={user} setIsOpen={setIsOpen} />}
		</div>
	);
};

export default UserMenu;
