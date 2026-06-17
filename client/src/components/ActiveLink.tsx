"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface ActiveLinkProps {
	href: string;
	children: ReactNode;
	className?: string;
}

export default function ActiveLink({ href, children, className = "" }: ActiveLinkProps) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			className={`group flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
				isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
			} ${className}`}>
			{children}
		</Link>
	);
}
