// TeacherDashboardPage.tsx
import { auth } from "@auth";
import PendingRequests from "@components/dashboard/PendingRequests";
import StatsGrid from "@components/dashboard/StatsGrid";
import UpcomingSessions from "@components/dashboard/UpcomingSessions";
import WelcomeBanner from "@components/dashboard/WelcomeBanner";
import { api } from "@utils/api";

const TeacherDashboardPage = async () => {
	const session = await auth();
	const teacherName = session?.user?.name || "Teacher";

	const { data: dashboardData } = await api.dashboard.teacherDashboard(session?.backendToken || "");

	// Safe defaults at destructuring level
	const upcomingBookings = dashboardData?.upcomingBookings ?? [];
	const pendingRequests = dashboardData?.pendingRequests ?? [];
	const teacherSubjects = dashboardData?.teaches ?? [];

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			<WelcomeBanner
				teacherName={teacherName}
				upcomingCount={upcomingBookings.length}
				pendingCount={pendingRequests.length}
				teaches={teacherSubjects}
			/>

			<StatsGrid dashboardData={dashboardData} />

			<div className='grid gap-8 lg:grid-cols-3'>
				<UpcomingSessions sessions={upcomingBookings} />
				<PendingRequests requests={pendingRequests} />
			</div>
		</div>
	);
};

export default TeacherDashboardPage;
