import type { Route } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";

import { buttonClass } from "@components/ui/styles";

// any URL that doesn't match a route
const NotFound = () => (
  <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-[#0b0f19]">
    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">404</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1>
    <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
      The page you&apos;re looking for doesn&apos;t exist or has moved.
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      <Link href={ROUTES.HOME as Route} className={buttonClass("primary")}>
        Go home
      </Link>
      <Link href={ROUTES.DASHBOARD.ROOT as Route} className={buttonClass("secondary")}>
        My dashboard
      </Link>
    </div>
  </main>
);

export default NotFound;
