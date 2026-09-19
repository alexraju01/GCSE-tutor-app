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
import { UserRole } from "@/types/role";
import QuickToolsList from "@components/QuickToolsList";
import StatsGrid, {
  STAT_ACCENTS,
  type StatItem,
} from "@components/dashboard/StatsGrid";
import UpcomingSessions from "@components/dashboard/UpcomingSessions";
import { WelcomeBanner } from "@components";
import Link from "next/link";

const StudentDashboardPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-up");
  }

  // Layout only checks a session exists, not the role vs. this route.
  if (session.user.role !== UserRole.Student) {
    redirect("/dashboard/teacher");
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
      ...STAT_ACCENTS.blue,
    },
    {
      label: "Learning Hours",
      value: `${studentDashboard?.totalHoursLearned ?? 0} hrs`,
      caption: "Total logged study time",
      icon: (
        <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
      ),
      ...STAT_ACCENTS.emerald,
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
      ...STAT_ACCENTS.indigo,
    },
    {
      label: "Subjects",
      value: String(studentDashboard?.subjects?.length ?? 0),
      caption: "Currently enrolled in",
      icon: (
        <BookOpen size={16} className="text-amber-600 dark:text-amber-400" />
      ),
      ...STAT_ACCENTS.amber,
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
        ctaLabel="Find a Tutor"
        ctaHref="/teachers"
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
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Calendar size={16} />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Book a Session
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Find qualified GCSE tutors and schedule 1-on-1 live sessions.
            </p>
            <Link
              href="/teachers"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
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
