"use client";

import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@constants/routes";

interface AvatarProps {
  user: any;
  setIsOpen: (open: boolean) => void;
}

export default function Avatar({ user, setIsOpen }: AvatarProps) {
  const formattedRole =
    user?.role === "TEACHER" ? "Teacher Account" : "Student Account";

  const dashboardLink =
    user?.role === "TEACHER"
      ? ROUTES.DASHBOARD.TEACHER
      : ROUTES.DASHBOARD.STUDENT;

  const handleFakeSignOut = () => {
    setIsOpen(false);
    alert("Mock action: Logging out user and redirecting to homepage...");
    window.location.href = "/";
  };

  return (
    <>
      <div
        className="fixed inset-0 z-10 cursor-default"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute top-full right-0 z-20 mt-3 w-60 origin-top-right transform overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all duration-200">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3.5">
          <p className="truncate text-sm font-bold text-slate-900">
            {user?.name || "GCSE Ace User"}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {user?.email}
          </p>

          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            {formattedRole}
          </div>
        </div>

        <div className="space-y-0.5 p-1.5">
          <Link
            href={dashboardLink}
            onClick={() => setIsOpen(false)}
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600"
          >
            <LayoutDashboard
              size={16}
              className="text-slate-400 transition-colors group-hover:text-blue-600"
            />
            Go to Dashboard
          </Link>

          <hr className="mx-1 my-1 border-slate-100" />

          <button
            onClick={handleFakeSignOut}
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut
              size={16}
              className="text-red-400 transition-colors group-hover:text-red-600"
            />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
