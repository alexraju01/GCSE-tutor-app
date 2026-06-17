import Link from "next/link";
import { ArrowRight, Calendar, Video, PenTool, Sparkles, CheckCircle2, Users } from "lucide-react";

export default function LandingPage() {
	return (
		<div className='flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-200 antialiased selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-500'>
			<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-linear-to-r from-transparent via-blue-500/20 dark:via-blue-500/40 to-transparent' />

			{/* Hero Section */}
			<section className='relative pt-32 pb-24 md:pt-44 md:pb-36 flex flex-col items-center justify-center overflow-hidden'>
				<div className='absolute top-[-10%] left-1/2 -translate-x-1/2 w-150 h-75 bg-blue-500/10 dark:bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none' />
				<div className='absolute top-[15%] left-1/3 size-100 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full filter blur-[140px] pointer-events-none animate-pulse [animation-duration:8s]' />

				<div className='max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center'>
					<div className='inline-flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 tracking-wide mb-8 shadow-sm dark:shadow-2xl transition-all duration-300 group cursor-pointer'>
						<Sparkles
							size={14}
							className='text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform'
						/>
						<span className='bg-linear-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent'>
							Next-Gen GCSE Learning Platform
						</span>
						<span className='relative flex size-2'>
							<span className='animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-75'></span>
							<span className='relative inline-flex rounded-full size-2 bg-blue-500'></span>
						</span>
					</div>

					{/* Headline */}
					<h1 className='text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-3xl opacity-0 animate-fade-in-up'>
						Master your GCSEs <br />
						with{" "}
						<span className='relative text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400 font-black'>
							Absolute Confidence.
						</span>
					</h1>

					<p className='text-lg md:text-xl text-slate-600 dark:text-slate-400 mt-8 max-w-2xl leading-relaxed opacity-0 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:forwards]'>
						Personalised 1-on-1 online lessons engineered around your syllabus. Book premium tutors,
						collaborate on live canvases, and dominate your exams.
					</p>

					<div className='mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto opacity-0 animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:forwards]'>
						<Link
							href='/signup'
							className='relative w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-blue-500 transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.15)] dark:shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:shadow-[0_0_40px_rgba(37,99,235,0.3)] dark:hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 group overflow-hidden active:scale-[0.98]'>
							<div className='absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shine' />
							Book a Free Trial Lesson
							<ArrowRight size={18} className='group-hover:translate-x-1 transition-transform' />
						</Link>

						<Link
							href='/login'
							className='w-full sm:w-auto bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl font-semibold text-base hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs active:scale-[0.98]'>
							Student Login
						</Link>
					</div>

					<div className='mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-500 opacity-0 animate-fade-in-up [animation-delay:500ms] [animation-fill-mode:forwards]'>
						<span className='flex items-center gap-1'>
							<CheckCircle2 size={14} className='text-emerald-600 dark:text-emerald-500/80' />
							No credit card required
						</span>
					</div>
				</div>
			</section>

			{/* Bento Grid Features Section */}
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
						<div className='md:col-span-2 h-60 md:h-auto relative rounded-3xl bg-white dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] border border-slate-200 dark:border-slate-800/80 p-8 flex flex-col justify-between overflow-hidden group hover:border-blue-500/40 dark:hover:border-blue-500/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.05)] transition-all duration-500 cursor-pointer'>
							<div className='absolute -right-10 -bottom-10 size-44 bg-blue-500/3 dark:bg-blue-500/5 rounded-full filter blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500' />

							<div className='size-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 ease-out'>
								<Calendar size={22} />
							</div>

							<div className='relative z-10 max-w-md'>
								<h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300'>
									Effortless Scheduler
								</h3>
								<p className='text-slate-600 dark:text-slate-400 text-sm leading-relaxed'>
									Lock in recurring slots or grab immediate revision sessions matching your timezone
									and exam board inside three fast clicks.
								</p>
							</div>
						</div>

						{/* Card 2: Live Sessions */}
						<div className='h-60 md:h-auto relative rounded-3xl bg-white dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] border border-slate-200 dark:border-slate-800/80 p-8 flex flex-col justify-between overflow-hidden group hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] transition-all duration-500 cursor-pointer'>
							<div className='absolute -right-10 -bottom-10 size-44 bg-indigo-500/3 dark:bg-indigo-500/5 rounded-full filter blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500' />

							<div className='size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 ease-out'>
								<Video size={22} />
							</div>

							<div>
								<h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300'>
									HD Classroom Context
								</h3>
								<p className='text-slate-600 dark:text-slate-400 text-sm leading-relaxed'>
									Crystal clear real-time communication pipeline optimized for weak connections.
								</p>
							</div>
						</div>

						{/* Card 3: Interactive Canvas */}
						<div className='h-60 md:h-auto relative rounded-3xl bg-white dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] border border-slate-200 dark:border-slate-800/80 p-8 flex flex-col justify-between overflow-hidden group hover:border-purple-500/40 dark:hover:border-purple-500/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.05)] transition-all duration-500 cursor-pointer'>
							<div className='absolute -right-10 -bottom-10 size-44 bg-purple-500/3 dark:bg-purple-500/5 rounded-full filter blur-2xl group-hover:bg-purple-500/10 transition-colors duration-500' />

							<div className='size-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 dark:group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 ease-out'>
								<PenTool size={22} />
							</div>

							<div>
								<h3 className='text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300'>
									Shared Digital Canvas
								</h3>
								<p className='text-slate-600 dark:text-slate-400 text-sm leading-relaxed'>
									Co-draw complex geometry maps, drop in mock papers, and solve proofs
									simultaneously.
								</p>
							</div>
						</div>

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
		</div>
	);
}
