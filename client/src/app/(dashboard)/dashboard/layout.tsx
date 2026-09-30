import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import { ROUTES } from "@/constants/routes";
import Breadcrumb from "@components/Breadcrumb";
import DashboardNav from "@components/dashboard/DashboardNav";
import MobileNav from "@components/dashboard/MobileNav";
import NotificationBell from "@components/dashboard/NotificationBell";
import { requireSession } from "@utils/actions/session";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { user, role } = await requireSession();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#0b0f19] dark:text-slate-200">
      {/* SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 p-6 backdrop-blur-md md:flex dark:border-slate-800/80 dark:bg-[#0b0f19]/80">
        <div className="mb-8">
          <Logo />
        </div>

        <DashboardNav role={role} />

        {/* User Role Badge */}
        <div className="mt-auto flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User size={18} />
            </div>
            <div className="truncate text-xs">
              <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {user.name || user.email}
              </p>
              <p className="text-slate-500 dark:text-slate-400">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* TOP BAR */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800/80 dark:bg-[#0b0f19]/80">
          {/* LEFT SIDE: MENU (mobile) + BREADCRUMB */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <MobileNav role={role} />
            <Breadcrumb />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {/* Exit Dashboard Link */}
            <Link
              href={ROUTES.HOME}
              aria-label="Back to main site"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-3 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Main Site</span>
            </Link>

            <NotificationBell />

            <UserMenu user={user} />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
};
export default DashboardLayout;
