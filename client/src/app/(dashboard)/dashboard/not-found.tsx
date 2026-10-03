import type { Route } from "next";
import Link from "next/link";

import { SearchX } from "lucide-react";

import { ROUTES } from "@/constants/routes";

import { buttonClass } from "@components/ui/styles";

// notFound() from any dashboard page (e.g. a lesson that isn't yours)
const DashboardNotFound = () => (
  <div className="flex flex-1 flex-col items-center justify-center p-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <SearchX size={22} />
    </div>
    <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
      We couldn&apos;t find that
    </h2>
    <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
      It may have been removed, or you don&apos;t have access to it.
    </p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <Link href={ROUTES.DASHBOARD.ROOT as Route} className={buttonClass("primary")}>
        Back to dashboard
      </Link>
      <Link href={ROUTES.DASHBOARD.LESSONS as Route} className={buttonClass("secondary")}>
        My lessons
      </Link>
    </div>
  </div>
);

export default DashboardNotFound;
