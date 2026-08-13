import { auth } from "@auth";
import { PendingRequests } from "@components/dashboard/PendingRequests";
import { StatsGrid } from "@components/dashboard/StatsGrid";
import { UpcomingSessions } from "@components/dashboard/UpcomingSessions";
import { WelcomeBanner } from "@components/dashboard/WelcomeBanner";
import { api } from "@utils/api";

const TeacherDashboardPage = async () => {
	const session = await auth();
	const teacherName = session?.user?.name || "Teacher";

	const { data: dashboardData } = await api.dashboard.teacherDashboard(session?.backendToken || "");

	// Default fallback mock array until API delivers live pendingRequests
	const fallbackRequests: BookingRequest[] = [
		{
			id: "req-1",
			student: "Emma Watson",
			studentImage:
				"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
			subject: "GCSE Chemistry",
			date: "Fri, Aug 12",
			timeSlot: "3:00 PM - 4:00 PM",
			duration: "1 hr",
		},
		{
			id: "req-2",
			student: "Sophia Lin",
			subject: "GCSE Biology",
			date: "Sat, Aug 13",
			timeSlot: "11:00 AM - 12:30 PM",
			duration: "1.5 hrs",
		},
	];

	const upcomingBookings = dashboardData?.upcomingBookings ?? [];
	const pendingRequests = dashboardData?.pendingRequests?.length
		? dashboardData.pendingRequests
		: fallbackRequests;

	return (
		<div className='mx-auto max-w-6xl space-y-8'>
			<WelcomeBanner
				teacherName={teacherName}
				upcomingCount={upcomingBookings.length}
				pendingCount={pendingRequests.length}
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
