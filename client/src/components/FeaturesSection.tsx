import { Calendar, Video, PenTool, Users } from "lucide-react";
import FeatureCard from "./FeatureCard";

export default function FeaturesSection() {
	return (
		<section className='px-6 pb-32 relative z-10'>
			<div className='max-w-6xl mx-auto'>
				<div className='text-center max-w-2xl mx-auto mb-20'>
					<h2 className='text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight'>
						Engineered for high-performance learning.
					</h2>
					<p className='text-slate-600 dark:text-slate-400 mt-4 text-base md:text-lg'>
						Ditch the fragmented setups. Access an ecosystem crafted deliberately to compress your
						study hours and maximize grades.
					</p>
				</div>

				{/* Bento Grid Container */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-max md:auto-rows-[280px]'>
					{/* Card 1: Easy Booking */}
					<FeatureCard
						icon={<Calendar size={22} />}
						title='Effortless Scheduler'
						description='Lock in recurring slots or grab immediate revision sessions matching your timezone and exam board inside three fast clicks.'
						className='md:col-span-2 h-60 md:h-auto'
						themeColor='blue'
					/>

					{/* Card 2: Live Sessions */}
					<FeatureCard
						icon={<Video size={22} />}
						title='HD Classroom Context'
						description='Crystal clear real-time communication pipeline optimized for weak connections.'
						className='h-60 md:h-auto'
						themeColor='indigo'
					/>

					{/* Card 3: Interactive Canvas */}
					<FeatureCard
						icon={<PenTool size={22} />}
						title='Shared Digital Canvas'
						description='Co-draw complex geometry maps, drop in mock papers, and solve proofs simultaneously.'
						className='h-60 md:h-auto'
						themeColor='purple'
					/>

					{/* Card 4: 1v1 Tutoring (Complex Layout) */}
					<div className='md:col-span-2 relative rounded-3xl bg-white dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] border border-slate-200 dark:border-slate-800/80 p-8 flex flex-col md:flex-row items-stretch justify-between overflow-hidden gap-8 group hover:border-cyan-500/40 dark:hover:border-cyan-500/30 transition-all duration-500 cursor-pointer'>
						<div className='absolute -right-10 -bottom-10 size-44 bg-cyan-500/3 dark:bg-cyan-500/5 rounded-full filter blur-2xl group-hover:bg-cyan-500/10 transition-colors duration-500' />

						<div className='max-w-full md:max-w-[50%] flex flex-col justify-center relative z-10 mb-6 md:mb-0'>
							<div className='size-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-500 ease-out'>
								<Users size={22} />
							</div>
							<span className='text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest block mb-1'>
								Dedicated Attention
							</span>
							<h3 className='text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300'>
								1v1 Tutoring
							</h3>
							<p className='text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed'>
								No generic streams. Get direct live access to elite educators tailoring every
								concept to your pace and exam targets.
							</p>
						</div>

						<div className='relative flex flex-1 items-center justify-center w-full md:w-72 min-h-35 md:min-h-full bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden group-hover:border-cyan-500/20 transition-colors duration-500'>
							<div className='absolute inset-0 bg-linear-to-tr from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700' />

							<div className='flex -space-x-4 scale-110 md:scale-125 transition-transform duration-500 group-hover:scale-115 md:group-hover:scale-[1.3]'>
								<div className='size-12 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-md transform group-hover:-translate-x-2 transition-transform duration-500'>
									T
								</div>
								<div className='size-12 rounded-full bg-linear-to-r from-purple-500 to-pink-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-md transform group-hover:translate-x-2 transition-transform duration-500'>
									U
								</div>
							</div>

							<div className='absolute bottom-3 px-3 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse'>
								Live Room Active
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
