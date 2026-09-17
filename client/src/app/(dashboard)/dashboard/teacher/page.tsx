// TeacherDashboardPage.tsx
import { Clock, PoundSterling, Star, Users } from "lucide-react";
import { auth } from "@auth";
import QuickActionsCard from "@components/dashboard/QuickActionsCard";
import StatsGrid, { type StatItem } from "@components/dashboard/StatsGrid";
import UpcomingSessions from "@components/dashboard/UpcomingSessions";
import WelcomeBanner from "@components/dashboard/WelcomeBanner";
import { api } from "@utils/api";

const TeacherDashboardPage = async () => {
  const session = await auth();
  const teacherName = session?.user?.name || "Teacher";
  const backendToken = session?.backendToken || "";

  // Fetch dashboard summary and availability concurrently
  const [dashboardResponse, availabilityResponse] = await Promise.all([
    api.dashboard.teacherDashboard(backendToken),
    api.availability.getMyTeacherAvailabilities(backendToken),
  ]);
  const dashboardData = dashboardResponse?.data;

  // Destructure `data` from the API response payload
  const availabilitySlots = availabilityResponse?.data ?? [];

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
    },
    {
      label: "Hours Taught",
      value: `${dashboardData?.totalHoursTaught ?? 0} hrs`,
      caption: "Total logged teaching time",
      icon: (
        <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
      ),
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
    },
    {
      label: "Completed Lessons",
      value: String(dashboardData?.completedLessons ?? 0),
      caption: "Successfully delivered",
      icon: <Star size={16} className="text-amber-600 dark:text-amber-400" />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <WelcomeBanner
        role="Teacher"
        userName={teacherName}
        upcomingCount={upcomingBookings.length}
        subjects={teacherSubjects}
      />

      <StatsGrid stats={stats} />

      <div className="grid gap-8 lg:grid-cols-3">
        <UpcomingSessions isTeacher sessions={upcomingBookings} />

        {/* Sidebar: Availability & Quick Actions takes 1 column */}
        <div className="lg:col-span-1">
          <QuickActionsCard
            availabilitySlots={availabilitySlots}
            token={backendToken}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
