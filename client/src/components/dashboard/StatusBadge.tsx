// StatusBadge.tsx
const STATUS_STYLES: Record<string, string> = {
  Pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Upcoming: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Confirmed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Completed: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  Declined: "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

// friendlier labels than the raw status names
const STATUS_LABELS: Record<string, string> = {
  Pending: "Request pending",
  Confirmed: "Confirmed",
  Upcoming: "Booked",
};

const DEFAULT_STATUS_STYLE =
  "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
      STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE
    } ${className}`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default StatusBadge;
