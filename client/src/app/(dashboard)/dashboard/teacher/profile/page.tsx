import { auth } from "@auth";
import { ProfileHeader } from "@components/ProfileHeader";
import { ProfilePhotoSection } from "@components/ProfilePhotoSection";
import { PersonalInfoSection } from "@components/PersonalInfoSection";
import { TeachingInformationSection } from "@components/TeachingInformationSection";
import { api } from "@utils/api";

const TeacherProfilePage = async () => {
	const session = await auth();

	if (!session || !session.backendToken) {
		return <div>Please sign in to view your profile.</div>;
	}

	const { data: teacher } = await api.teacher.getMyProfile(session.backendToken);

	return (
		<div className='min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased'>
			<ProfileHeader />

			<main className='max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
				<div className='space-y-6 order-first lg:order-2'>
					<ProfilePhotoSection image={teacher?.user?.image} />
				</div>

				<div className='lg:col-span-2 space-y-6 order-last lg:order-1'>
					<PersonalInfoSection key={teacher?.user?.name || "loading"} user={teacher?.user} />

					<TeachingInformationSection
						key={teacher?.id || "teaching-loading"}
						teaches={teacher?.teaches}
					/>
				</div>
			</main>
		</div>
	);
};

export default TeacherProfilePage;
