"use client";

import { ChevronDown, Filter } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

interface StatusFilterSelectProps {
  value: string;
  options: { label: string; value: string; href: string }[];
}

// status filter as a dropdown, each option navigates to its own url
const StatusFilterSelect = ({ value, options }: StatusFilterSelectProps) => {
  const router = useRouter();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Filter lessons</span>
      <Filter size={14} className="pointer-events-none absolute left-2.5 text-blue-600" />
      <select
        value={value}
        onChange={(event) => {
          const option = options.find((o) => o.value === event.target.value);
          if (option) router.push(option.href as Route);
        }}
        className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-400" />
    </label>
  );
};

export default StatusFilterSelect;
