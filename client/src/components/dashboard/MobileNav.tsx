"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";

import Logo from "@/components/Logo";
import type { UserRole } from "@/types/role";

import DashboardNav from "./DashboardNav";

// the sidebar is hidden below md, so phones get the same links in a drawer
const MobileNav = ({ role }: { role: UserRole }) => {
  const pathname = usePathname();
  // remembers which page it was opened on, so any navigation (link click,
  // back/forward) closes it without an effect
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === pathname;
  const setIsOpen = (open: boolean) => setOpenedOn(open ? pathname : null);

  // escape closes it, and the page behind shouldn't scroll while it's open
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-dashboard-nav"
        className="-ml-2 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-dashboard-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 border-r border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#0b0f19]"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            {/* onNavigate covers tapping the page you're already on */}
            <DashboardNav role={role} onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
