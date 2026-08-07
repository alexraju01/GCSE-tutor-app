import { auth } from "@auth";
import {
  BookOpen,
  Calendar,
  Clock,
  LayoutDashboard,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import ActiveLink from "@/components/ActiveLink";
import Logo from "@/components/Logo";
import UserMenu from "@/components/UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-up");
  }

  const { user } = session;
  const isTeacher = user.role === "Teacher";

  const navItems: Array<{ label: string; href: Route; icon: React.ReactNode }> =
    [
      {
        label: "Overview",
        href: (isTeacher
          ? "/dashboard/teacher"
          : "/dashboard/student") as Route,
        icon: <LayoutDashboard size={18} />,
      },
      {
        label: "Lessons",
        href: "/dashboard/lessons" as Route,
        icon: <BookOpen size={18} />,
      },
      {
        label: "Schedule",
        href: "/dashboard/schedule" as Route,
        icon: <Calendar size={18} />,
      },
      {
        label: "Messages",
        href: "/dashboard/messages" as Route,
        icon: <MessageSquare size={18} />,
      },
      {
        label: "Settings",
        href: "/dashboard/settings" as Route,
        icon: <Settings size={18} />,
      },
    ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#0b0f19] dark:text-slate-200">
      {/* SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 p-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b0f19]/80 md:flex">
        <div className="mb-8">
          <Logo />
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 font-medium">
          {navItems.map((item) => (
            <ActiveLink key={item.href} href={item.href}>
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
            </ActiveLink>
          ))}
        </nav>

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
              <p className="text-slate-500 dark:text-slate-400">
                {user.role || "Student"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* TOP BAR */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b0f19]/80">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Dashboard /{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {isTeacher ? "Teacher Portal" : "Student Overview"}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu user={user} />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
