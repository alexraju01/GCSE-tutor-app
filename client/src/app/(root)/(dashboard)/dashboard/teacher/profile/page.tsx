import { api } from "@utils/api";
import { auth } from "@auth";
import { ProfileHeader } from "@components/ProfileHeader";
import { ProfilePhotoSection } from "@components/ProfilePhotoSection";
import { PersonalInfoSection } from "@components/PersonalInfoSection";

const TeacherProfilePage = async () => {
	const session = await auth();

	if (!session || !session.backendToken) {
		return <div>Please sign in to view your profile.</div>;
	}

	const { backendToken } = session;
	const { data: teacherProfile } = await api.teacher.getMyProfile(backendToken);
	console.log("Fetched Teacher Profile:", teacherProfile);

	return (
		<div className='min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased'>
			<ProfileHeader />

			<main className='max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
				{/* Right Column: Photo, Availability, Links */}
				<div className='space-y-6 order-first lg:order-2'>
					<ProfilePhotoSection image={teacherProfile?.user?.image} />
					{/* <AvailabilitySection /> */}
					{/* <LinksSection /> */}
				</div>

				{/* Left Column: Forms */}
				<div className='lg:col-span-2 space-y-6 order-last lg:order-1'>
					<PersonalInfoSection
						key={teacherProfile?.user?.name || "loading"}
						user={teacherProfile?.user}
						bio={teacherProfile?.bio}
					/>
					{/* <TeachingInformationSection /> */}
					{/* <EducationSection /> */}
				</div>
			</main>
		</div>
	);
};

export default TeacherProfilePage;
