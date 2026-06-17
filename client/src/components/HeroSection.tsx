import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function HeroSection() {
	return (
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

				{/* Sub-headline */}
				<p className='text-lg md:text-xl text-slate-600 dark:text-slate-400 mt-8 max-w-2xl leading-relaxed opacity-0 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:forwards]'>
					Personalised 1-on-1 online lessons engineered around your syllabus. Book premium tutors,
					collaborate on live canvases, and dominate your exams.
				</p>

				{/* CTAs */}
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

				{/* Social proof/Micro-copy */}
				<div className='mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-500 opacity-0 animate-fade-in-up [animation-delay:500ms] [animation-fill-mode:forwards]'>
					<span className='flex items-center gap-1'>
						<CheckCircle2 size={14} className='text-emerald-600 dark:text-emerald-500/80' />
						No credit card required
					</span>
				</div>
			</div>
		</section>
	);
}
