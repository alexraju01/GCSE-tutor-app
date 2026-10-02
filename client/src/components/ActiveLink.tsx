"use client";

import { ReactNode } from "react";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ActiveLinkProps {
  href: Route;
  children: ReactNode;
  className?: string;
  // by default a link is also active on its sub-pages (/lessons/123)
  exact?: boolean;
  onClick?: () => void;
}

const ActiveLink = ({
  href,
  children,
  className = "",
  exact = false,
  onClick,
}: ActiveLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (!exact && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
      } ${className}`}
    >
      {children}
    </Link>
  );
};

export default ActiveLink;
