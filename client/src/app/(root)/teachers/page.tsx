import { api } from "@utils/api";
import { Star, BookOpen, GraduationCap, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const TeachersPage = async () => {
	const { data: teachers, results } = await api.teacher.getAll();

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

			<main className='max-w-6xl mx-auto px-6 mt-12'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
					{teachers?.map(async (teacher) => {
						return (
							<div
								key={teacher.id}
								className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group'>
								<div>
									{/* Top Layout Row: Avatar + Name + Badges */}
									<div className='flex gap-4 items-start'>
										<div className='relative h-16 w-16 shrink-0'>
											<Image
												src={teacher.image || ""}
												alt={teacher.name || "Teacher Image"}
												fill
												className='rounded-xl object-cover border border-slate-100 shadow-sm'
											/>
										</div>
										<div className='flex-1 min-w-0'>
											<div className='flex items-center justify-between gap-2'>
												{/* 🎯 Next.js Link added here to route to your dynamic /teachers/[id]/page.tsx layout */}
												<h2 className='font-bold text-lg text-slate-900 truncate group-hover:text-blue-600 transition-colors'>
													<Link href={`/teachers/${teacher.id}`} className='hover:underline'>
														{teacher.name}
													</Link>
												</h2>
												<div className='flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold shrink-0'>
													<Star className='h-3.5 w-3.5 fill-amber-500 text-amber-500' />
													{teacher.rating.toFixed(1)}
												</div>
											</div>

											{/* Qualifications text */}
											<p className='text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium truncate'>
												<GraduationCap size={14} className='text-slate-400' />
												{teacher.qualifications}
											</p>
										</div>
									</div>

									{/* Bio Snippet */}
									<p className='text-sm text-slate-600 mt-4 line-clamp-3 leading-relaxed'>
										{teacher.bio}
									</p>
								</div>

								{/* Footer Row: Pricing & CTA Button */}
								<div className='mt-6 pt-4 border-t border-slate-100 flex items-center justify-between'>
									<div>
										<span className='text-2xl font-extrabold text-slate-900'>
											£{teacher.hourlyRate}
										</span>
										<span className='text-xs text-slate-500 font-medium'> / hr</span>
									</div>
									{/* Book Lesson CTA: Direct state injection skips unneeded layout loading steps */}
									<button>Book Now</button>
								</div>
							</div>
						);
					})}
				</div>

				{/* Empty State Fallback if zero teachers loaded */}
				{results === 0 && (
					<div className='text-center bg-white border rounded-2xl p-12 mt-4'>
						<BookOpen className='mx-auto text-slate-300 mb-3' size={40} />
						<h3 className='font-bold text-lg'>No active teachers listed</h3>
						<p className='text-sm text-slate-500 mt-1'>
							Please verify your server database seeding files or API layer.
						</p>
					</div>
				)}
			</main>
		</div>
	);
};

export default TeachersPage;
