import { Calendar, PenTool, Users, Video } from "lucide-react";

import { FeatureCard } from "@components";

const FeaturesSection = () => {
  return (
    <section className="relative z-10 px-6 pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            Engineered for high-performance learning.
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg dark:text-slate-400">
            Ditch the fragmented setups. Access an ecosystem crafted
            deliberately to compress your study hours and maximize grades.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid auto-rows-max grid-cols-1 gap-6 md:auto-rows-[280px] md:grid-cols-3">
          {/* Card 1: Easy Booking */}
          <FeatureCard
            icon={<Calendar size={22} />}
            title="Effortless Scheduler"
            description="Lock in recurring slots or grab immediate revision sessions matching your timezone and exam board inside three fast clicks."
            className="h-60 md:col-span-2 md:h-auto"
            themeColor="blue"
          />

          {/* Card 2: Live Sessions */}
          <FeatureCard
            icon={<Video size={22} />}
            title="HD Classroom Context"
            description="Crystal clear real-time communication pipeline optimized for weak connections."
            className="h-60 md:h-auto"
            themeColor="indigo"
          />

          {/* Card 3: Interactive Canvas */}
          <FeatureCard
            icon={<PenTool size={22} />}
            title="Shared Digital Canvas"
            description="Co-draw complex geometry maps, drop in mock papers, and solve proofs simultaneously."
            className="h-60 md:h-auto"
            themeColor="purple"
          />

          {/* Card 4: 1v1 Tutoring (Complex Layout) */}
          <div className="group relative flex cursor-pointer flex-col items-stretch justify-between gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:border-cyan-500/40 md:col-span-2 md:flex-row dark:border-slate-800/80 dark:bg-linear-to-b dark:from-slate-900 dark:to-[#111625] dark:hover:border-cyan-500/30">
            <div className="absolute -right-10 -bottom-10 size-44 rounded-full bg-cyan-500/3 blur-2xl filter transition-colors duration-500 group-hover:bg-cyan-500/10 dark:bg-cyan-500/5" />

            <div className="relative z-10 mb-6 flex max-w-full flex-col justify-center md:mb-0 md:max-w-[50%]">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-600 transition-all duration-500 ease-out group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
                <Users size={22} />
              </div>
              <span className="mb-1 block text-xs font-semibold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
                Dedicated Attention
              </span>
              <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                1v1 Tutoring
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
                No generic streams. Get direct live access to elite educators
                tailoring every concept to your pace and exam targets.
              </p>
            </div>

            <div className="relative flex min-h-35 w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-50 transition-colors duration-500 group-hover:border-cyan-500/20 md:min-h-full md:w-72 dark:border-slate-800/60 dark:bg-slate-950/40">
              <div className="absolute inset-0 bg-linear-to-tr from-cyan-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

              <div className="flex scale-110 -space-x-4 transition-transform duration-500 group-hover:scale-115 md:scale-125 md:group-hover:scale-[1.3]">
                <div className="flex size-12 transform items-center justify-center rounded-full border-2 border-white bg-linear-to-r from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-md transition-transform duration-500 group-hover:-translate-x-2 dark:border-slate-900">
                  T
                </div>
                <div className="flex size-12 transform items-center justify-center rounded-full border-2 border-white bg-linear-to-r from-purple-500 to-pink-500 text-xs font-bold text-white shadow-md transition-transform duration-500 group-hover:translate-x-2 dark:border-slate-900">
                  U
                </div>
              </div>

              <div className="absolute bottom-3 animate-pulse rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                Live Room Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;
