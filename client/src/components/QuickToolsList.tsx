import Link from "next/link";
import type { Route } from "next";
import { Compass, Video, BookOpen } from "lucide-react";

interface QuickToolItem {
  label: string;
  href: Route;
  icon: React.ReactNode;
  chipClassName: string;
}

const quickTools: QuickToolItem[] = [
  {
    label: "Browse Tutors",
    href: "/teachers" as Route,
    icon: <Compass size={14} />,
    chipClassName:
      "bg-blue-100/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  },
  {
    label: "Open Collaborative Canvas",
    href: "/whiteboard" as Route,
    icon: <Video size={14} />,
    chipClassName:
      "bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
  },
  {
    label: "My Learning Material",
    href: "/dashboard/lessons" as Route,
    icon: <BookOpen size={14} />,
    chipClassName:
      "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
];

const QuickToolsList = () => {
  return (
    <div className="mt-3 flex flex-col gap-2.5">
      {quickTools.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left text-xs font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <div className={`rounded-lg p-1.5 ${tool.chipClassName}`}>
            {tool.icon}
          </div>
          <span>{tool.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickToolsList;
