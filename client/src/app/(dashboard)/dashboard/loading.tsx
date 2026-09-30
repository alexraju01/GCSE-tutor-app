// shown inside the dashboard layout (sidebar/header stay put) while a page's
// server data loads. generic on purpose so it fits every dashboard page
const Bar = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800/70 ${className}`}
  />
);

const DashboardLoading = () => (
  <div className="mx-auto max-w-6xl space-y-8" role="status" aria-live="polite">
    <span className="sr-only">Loading…</span>

    <div className="space-y-2">
      <Bar className="h-8 w-56" />
      <Bar className="h-4 w-80 max-w-full" />
    </div>

    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <Bar className="h-3 w-20" />
          <Bar className="h-7 w-16" />
        </div>
      ))}
    </div>

    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <Bar className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-1/3" />
            <Bar className="h-3 w-1/2" />
          </div>
          <Bar className="hidden h-8 w-24 sm:block" />
        </div>
      ))}
    </div>
  </div>
);

export default DashboardLoading;
