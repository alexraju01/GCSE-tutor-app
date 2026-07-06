import { api } from "@utils/api";
import { Eye, Upload } from "lucide-react";
import Image from "next/image";
import { auth } from "@auth";

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
			{/* Top Header */}
			<header className='max-w-6xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900'>Update Profile</h1>
					<p className='text-sm text-slate-500 mt-1'>
						Manage your personal information and teaching details.
					</p>
				</div>
				<button className='flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm'>
					<Eye className='w-4 h-4 text-slate-500' />
					Preview Profile
				</button>
			</header>

			{/* Main Container */}
			<main className='max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
				{/* Right Column: Profile Photo, Availability & Links */}
				<div className='space-y-6 order-first lg:order-2'>
					{/* Section 1: Profile Photo */}
					<section className='bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center'>
						<h2 className='text-base font-semibold text-slate-900 w-full text-left mb-5'>
							Profile Photo
						</h2>

						<div className='relative inline-block mb-4'>
							<Image
								src={teacherProfile?.user.image || "/default-profile.png"}
								alt='Profile Preview'
								width={144}
								height={144}
								className='w-36 h-36 rounded-full object-cover border border-slate-100'
							/>

							<button className='absolute bottom-1 right-1 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600'>
								<svg
									className='w-3.5 h-3.5'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									strokeWidth='2.5'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125'
									/>
								</svg>
							</button>
						</div>

						<p className='text-[11px] text-slate-400 mb-4'>JPG, PNG or WebP. Max size 2MB.</p>

						<button className='flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm w-full justify-center'>
							<Upload className='w-4 h-4 text-slate-500' />
							Change Photo
						</button>
					</section>

					{/* Section 2: Availability */}

					{/* Section 3: Links */}
				</div>

				{/* Left Column: Forms */}

				<div className='lg:col-span-2 space-y-6 order-last lg:order-1'>
					{/* Section 4: Personal Information */}

					{/* Section 5: Teaching Information */}

					{/* Section 6: Education */}
				</div>
			</main>
		</div>
	);
};
export default TeacherProfilePage;
