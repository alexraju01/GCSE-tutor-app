// TeacherDashboardPage.tsx
import { auth } from "@auth";
import QuickActionsCard from "@components/dashboard/QuickActionsCard";
import StatsGrid from "@components/dashboard/StatsGrid";
import UpcomingSessions from "@components/dashboard/UpcomingSessions";
import WelcomeBanner from "@components/dashboard/WelcomeBanner";
import { api } from "@utils/api";

const TeacherDashboardPage = async () => {
	const session = await auth();
	const teacherName = session?.user?.name || "Teacher";
	const backendToken = session?.backendToken || "";

	// Fetch dashboard summary and availability concurrently to save response time
	const [dashboardResponse, availabilityResponse] = await Promise.all([
		api.dashboard.teacherDashboard(backendToken),
		api.availability.getAll(backendToken),
	]);

	const dashboardData = dashboardResponse?.data;

	// Destructure `data` from the API response payload
	const availabilitySlots = availabilityResponse?.data ?? [];

	const upcomingBookings = dashboardData?.upcomingBookings ?? [];
	const teacherSubjects = dashboardData?.teaches ?? [];

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			<WelcomeBanner
				teacherName={teacherName}
				upcomingCount={upcomingBookings.length}
				teaches={teacherSubjects}
			/>

			<StatsGrid dashboardData={dashboardData} />

			<div className='grid gap-8 lg:grid-cols-3'>
				{/* Main section: Upcoming sessions takes 2 columns */}
				<div className='lg:col-span-2'>
					<UpcomingSessions sessions={upcomingBookings} />
				</div>

				{/* Sidebar: Availability & Quick Actions takes 1 column */}
				<div className='lg:col-span-1'>
					<QuickActionsCard availabilitySlots={availabilitySlots} token={backendToken} />
				</div>
			</div>
		</div>
	);
};

export default TeacherDashboardPage;
