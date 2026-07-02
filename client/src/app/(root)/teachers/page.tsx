import { api } from "@utils/api";
import { Search } from "lucide-react";

const TeachersPage = async () => {
	const { data: teachers } = await api.teacher.getAll();
	console.log("Teachers data:", teachers); // Log the fetched teachers data for debugging
	return (
		<div className='min-h-screen bg-slate-50 pb-16'>
			{/* Header / Search Hero Section */}
			<div className='bg-white border-b border-slate-200 py-12 px-6'>
				<div className='max-w-6xl mx-auto text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
					<div>
						<h1 className='text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl'>
							Find Your Perfect Tutor
						</h1>
						<p className='mt-2 text-lg text-slate-600'>
							Verified Grade 9 specialist educators tailored to your curriculum.
						</p>
					</div>

					{/* Inline Filter Search component mockup */}
					<div className='w-full md:max-w-md flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition'>
						<Search className='text-slate-400 shrink-0' size={20} />
						<input
							type='text'
							placeholder='Search subjects (e.g., Chemistry, Physics)...'
							className='bg-transparent text-sm w-full outline-none text-slate-800'
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeachersPage;
