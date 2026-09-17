import { redirect } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  UserCheck,
} from "lucide-react";

import { auth } from "@auth";
import { api } from "@utils/api";
import QuickToolsList from "@components/QuickToolsList";
import StatsGrid, { type StatItem } from "@components/dashboard/StatsGrid";
import UpcomingSessions from "@components/dashboard/UpcomingSessions";
import { WelcomeBanner } from "@components";
import Link from "next/link";

const StudentDashboardPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-up");
  }

  const { data: studentDashboard } = await api.dashboard.studentDashboard(
    session?.backendToken || "",
  );

  const { user } = session;

  const upcomingLessons = studentDashboard?.upcomingLessons ?? [];

  const stats: StatItem[] = [
    {
      label: "Active Tutors",
      value: String(studentDashboard?.activeTeachers ?? 0),
      caption: "Current active tutors",
      icon: (
        <UserCheck size={16} className="text-blue-600 dark:text-blue-400" />
      ),
    },
    {
      label: "Learning Hours",
      value: `${studentDashboard?.totalHoursLearned ?? 0} hrs`,
      caption: "Total logged study time",
      icon: (
        <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
      ),
    },
    {
      label: "Completed Lessons",
      value: String(studentDashboard?.completedLessons ?? 0),
      caption: "Successfully attended",
      icon: (
        <CheckCircle
          size={16}
          className="text-indigo-600 dark:text-indigo-400"
        />
      ),
    },
    {
      label: "Subjects",
      value: String(studentDashboard?.subjects?.length ?? 0),
      caption: "Currently enrolled in",
      icon: (
        <BookOpen size={16} className="text-amber-600 dark:text-amber-400" />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[100rem] space-y-8 pb-10">
      {/* WELCOME BANNER */}
      <WelcomeBanner
        role="Student"
        userName={user.name || "Student"}
        upcomingCount={upcomingLessons.length}
        subjects={studentDashboard?.subjects}
      />

      {/* METRICS GRID */}
      <StatsGrid stats={stats} />

      {/* TWO-COLUMN CONTENT AREA */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <UpcomingSessions isTeacher={false} sessions={upcomingLessons} />

        {/* SIDEBAR WIDGETS COLUMN (1/3) */}
        <div className="space-y-6">
          {/* BOOK NEW LESSON WIDGET */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Calendar
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                <span>Book a Session</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Find qualified GCSE tutors and schedule 1-on-1 live sessions.
            </p>
            <Link
              href="/teachers"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>Find & Book Tutor</span>
            </Link>
          </div>

          {/* QUICK TOOLS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Tools
            </p>
            <QuickToolsList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
