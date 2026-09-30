import { CalendarDays, Mail, MessageSquare } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { buttonClass } from "@components/ui/styles";

// messaging isn't built yet - point people at what they can do today
// instead of showing fake conversations
const MessagesPage = () => (
  <div className="mx-auto max-w-2xl">
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <MessageSquare size={22} />
      </div>
      <span className="mt-4 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-400">
        Coming soon
      </span>
      <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">
        Messages are on the way
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        You&apos;ll soon be able to chat with your tutor or student here. For
        now, each lesson page shows the other person&apos;s email address.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href={ROUTES.DASHBOARD.LESSONS as Route}
          className={buttonClass("primary")}
        >
          <Mail size={14} /> Go to my lessons
        </Link>
        <Link
          href={ROUTES.DASHBOARD.SCHEDULE as Route}
          className={buttonClass("secondary")}
        >
          <CalendarDays size={14} /> View schedule
        </Link>
      </div>
    </div>
  </div>
);

export default MessagesPage;
