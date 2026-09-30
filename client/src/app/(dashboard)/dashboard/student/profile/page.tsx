import { BookOpen, User } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { UserRole } from "@/types/role";
import { buttonClass } from "@components/ui/styles";
import { requireRole } from "@utils/actions/session";
import { api } from "@utils/api";
import { formatSubject } from "@utils/format";

const StudentProfilePage = async () => {
  const { user, token } = await requireRole(UserRole.Student);

  // no student profile endpoint yet - the dashboard summary includes subjects
  const dashboard = await api.dashboard
    .studentDashboard(token)
    .catch(() => null);
  const subjects = dashboard?.data?.subjects ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your account details and the subjects you&apos;re studying.
        </p>
      </div>

      <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          {user.image ? (
            <Image
              referrerPolicy="no-referrer"
              src={user.image}
              alt={user.name || "Profile photo"}
              fill
              className="object-cover"
            />
          ) : (
            <User size={28} />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
            {user.name || "Student"}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {user.email}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
          Subjects
        </h2>

        {subjects.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {subjects.map((item) => (
              <li
                key={item.id}
                className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                {formatSubject(item.subject)} · {formatSubject(item.level)}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No subjects on your profile yet.
            </p>
            <Link
              href={ROUTES.TEACHERS as Route}
              className={buttonClass("primary")}
            >
              Find a tutor
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentProfilePage;
