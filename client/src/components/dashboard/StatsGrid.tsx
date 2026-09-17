import type { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  iconBg?: string;
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
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {stat.label}
            </span>
            <div
              className={`rounded-lg p-2 ${stat.iconBg ?? "bg-slate-50 dark:bg-slate-800/60"}`}
            >
              {stat.icon}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stat.value}
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {stat.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
