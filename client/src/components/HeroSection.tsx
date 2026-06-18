import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden pt-32 pb-24 md:pt-44 md:pb-36">
      <div className="pointer-events-none absolute top-[-10%] left-1/2 h-75 w-150 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px] filter dark:bg-blue-600/10" />
      <div className="pointer-events-none absolute top-[15%] left-1/3 size-100 animate-pulse rounded-full bg-indigo-500/10 blur-[140px] filter [animation-duration:8s] dark:bg-indigo-600/15" />{" "}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="group mb-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:shadow-2xl dark:hover:border-slate-700">
          <Sparkles
            size={14}
            className="text-blue-600 transition-transform group-hover:rotate-12 dark:text-blue-400"
          />
          <span className="bg-linear-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-slate-200 dark:to-slate-400">
            Next-Gen GCSE Learning Platform
          </span>
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-blue-500 p-4 text-center font-bold text-white shadow-lg hover:bg-blue-700 md:p-6">
          Test Tailwind Sorting
        </div>
        {/* Headline */}
        <h1 className="animate-fade-in-up max-w-3xl text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 opacity-0 sm:text-6xl md:text-7xl dark:text-white">
          Master your GCSEs <br />
          with{" "}
          <span className="relative bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text font-black text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-indigo-400">
            Absolute Confidence.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-in-up mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards] md:text-xl dark:text-slate-400">
          Personalised 1-on-1 online lessons engineered around your syllabus.
          Book premium tutors, collaborate on live canvases, and dominate your
          exams.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up mt-10 flex w-full flex-col items-center justify-center gap-4 opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards] sm:w-auto sm:flex-row">
          <Link
            href="/sign-up"
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.3)] active:scale-[0.98] sm:w-auto dark:shadow-[0_0_30px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]"
          >
            <div className="group-hover:animate-shine absolute inset-0 h-full w-1/2 -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent" />
            Book a Free Trial Lesson
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <Link
            href="/sign-in"
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-xs transition-all duration-300 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] sm:w-auto dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
          >
            Student Login
          </Link>
        </div>

        {/* Social proof/Micro-copy */}
        <div className="animate-fade-in-up mt-8 flex flex-col items-center gap-4 text-xs text-slate-500 opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards] sm:flex-row sm:gap-6 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2
              size={14}
              className="text-emerald-600 dark:text-emerald-500/80"
            />
            No credit card required
          </span>
        </div>
      </div>
    </section>
  );
}
