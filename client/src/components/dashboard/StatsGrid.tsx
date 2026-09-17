import type { ReactNode } from "react";

// Shared color presets so every dashboard's stat tiles pull from the same
// palette instead of each page re-typing its own iconBg/glow strings.
export const STAT_ACCENTS = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    glow: "bg-blue-400/30 dark:bg-blue-500/20",
  },
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    glow: "bg-emerald-400/30 dark:bg-emerald-500/20",
  },
  indigo: {
    iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
    glow: "bg-indigo-400/30 dark:bg-indigo-500/20",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    glow: "bg-amber-400/30 dark:bg-amber-500/20",
  },
} as const satisfies Record<string, { iconBg: string; glow: string }>;

export interface StatItem {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  iconBg?: string;
  glow?: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

const StatsGrid = ({ stats }: StatsGridProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <div
            className={`pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl transition-opacity group-hover:opacity-80 ${stat.glow ?? "bg-slate-300/30 dark:bg-slate-700/20"}`}
          />

          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {stat.label}
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.iconBg ?? "bg-slate-50 dark:bg-slate-800/60"}`}
            >
              {stat.icon}
            </div>
          </div>
          <div className="relative mt-4">
            <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {stat.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
