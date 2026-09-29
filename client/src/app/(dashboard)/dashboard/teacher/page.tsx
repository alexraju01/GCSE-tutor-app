// TeacherDashboardPage.tsx
import { Clock, PoundSterling, Star, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@auth";
import { UserRole } from "@/types/role";
import QuickActionsCard from "@components/dashboard/QuickActionsCard";
import StatsGrid, {
  STAT_ACCENTS,
  type StatItem,
} from "@components/dashboard/StatsGrid";
import UpcomingSessions from "@components/dashboard/UpcomingSessions";
import WelcomeBanner from "@components/dashboard/WelcomeBanner";
import { api } from "@utils/api";

// days ahead shown on the availability card
const AVAILABILITY_LOOKAHEAD_DAYS = 14;

const TeacherDashboardPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-up");
  }

  // Mirrors the guard on the student dashboard.
  if (session.user.role !== UserRole.Teacher) {
    redirect("/dashboard/student");
  }

  const teacherName = session.user.name || "Teacher";
  const backendToken = session.backendToken || "";

  const now = new Date();
  const lookaheadEnd = new Date(now.getTime() + AVAILABILITY_LOOKAHEAD_DAYS * 86_400_000);

  // dashboard summary + next 2 weeks of availability
  const [dashboardResponse, availabilityResponse] = await Promise.all([
    api.dashboard.teacherDashboard(backendToken),
    api.availability
      .getMine({ from: now, to: lookaheadEnd }, backendToken)
      .catch(() => null),
  ]);
  const dashboardData = dashboardResponse?.data;

  const availabilitySlots = availabilityResponse?.data ?? [];
  const openSlots = availabilitySlots.filter((slot) => !slot.isBooked).length;
  const bookedSlots = availabilitySlots.length - openSlots;

  const upcomingBookings = dashboardData?.upcomingLessons ?? [];
  const teacherSubjects = dashboardData?.teaches ?? [];

  const formattedEarnings = dashboardData?.totalEarnings
    ? new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: dashboardData.totalEarnings.currency || "GBP",
      }).format(dashboardData.totalEarnings.amount)
    : "£0.00";

  const stats: StatItem[] = [
    {
      label: "Active Students",
      value: String(dashboardData?.activeStudents ?? 0),
      caption: "Current active students",
      icon: <Users size={16} className="text-blue-600 dark:text-blue-400" />,
      ...STAT_ACCENTS.blue,
    },
    {
      label: "Hours Taught",
      value: `${dashboardData?.totalHoursTaught ?? 0} hrs`,
      caption: "Total logged teaching time",
      icon: (
        <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
      ),
      ...STAT_ACCENTS.emerald,
    },
    {
      label: "Total Earnings",
      value: formattedEarnings,
      caption: "Lifetime earnings",
      icon: (
        <PoundSterling
          size={16}
          className="text-indigo-600 dark:text-indigo-400"
        />
      ),
      ...STAT_ACCENTS.indigo,
    },
    {
      label: "Completed Lessons",
      value: String(dashboardData?.completedLessons ?? 0),
      caption: "Successfully delivered",
      icon: <Star size={16} className="text-amber-600 dark:text-amber-400" />,
      ...STAT_ACCENTS.amber,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <WelcomeBanner
        role="Teacher"
        userName={teacherName}
        upcomingCount={upcomingBookings.length}
        subjects={teacherSubjects}
        ctaLabel="View Full Schedule"
        ctaHref="/dashboard/schedule"
      />

      <StatsGrid stats={stats} />

      <div className="grid gap-8 lg:grid-cols-3">
        <UpcomingSessions isTeacher sessions={upcomingBookings} />

        {/* Sidebar: Availability & Quick Actions takes 1 column */}
        <div className="lg:col-span-1">
          <QuickActionsCard
            openSlots={openSlots}
            bookedSlots={bookedSlots}
            pendingRequests={dashboardData?.pendingRequests ?? 0}
            lookaheadDays={AVAILABILITY_LOOKAHEAD_DAYS}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
