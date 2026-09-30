import {
  CalendarRange,
  ChevronRight,
  Settings2,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { profileRouteFor, ROUTES } from "@/constants/routes";
import SignOutButton from "@components/SignOutButton";
import { requireSession } from "@utils/actions/session";

interface SettingsLink {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SettingsPage = async () => {
  const { user, role, isTeacher } = await requireSession();

  const links: SettingsLink[] = [
    {
      href: profileRouteFor(role),
      label: "Profile",
      description: isTeacher
        ? "Your photo, bio and the subjects you teach."
        : "Your account details and subjects.",
      icon: <UserRound size={18} />,
    },
    ...(isTeacher
      ? [
          {
            href: `${ROUTES.DASHBOARD.TEACHER_PROFILE}#booking-policy`,
            label: "Booking rules",
            description:
              "Notice period, how far ahead students can book, cancellations and approvals.",
            icon: <Settings2 size={18} />,
          },
          {
            href: ROUTES.DASHBOARD.AVAILABILITY,
            label: "Availability",
            description: "The hours students can book you for.",
            icon: <CalendarRange size={18} />,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account.
        </p>
      </div>

      {/* ACCOUNT */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
          Account
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {user.name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              Email
            </dt>
            <dd className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {user.email || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              Account type
            </dt>
            <dd className="font-semibold text-slate-900 dark:text-slate-100">
              {role}
            </dd>
          </div>
        </dl>
      </section>

      {/* SHORTCUTS */}
      <section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href as Route}
            className="flex items-center gap-4 p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {link.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {link.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {link.description}
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-slate-400" />
          </Link>
        ))}
      </section>

      {/* SIGN OUT */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign out
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign out of GCSE Ace on this device.
          </p>
        </div>
        <SignOutButton />
      </section>
    </div>
  );
};

export default SettingsPage;
