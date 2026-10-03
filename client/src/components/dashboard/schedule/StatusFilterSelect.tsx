"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { Filter } from "lucide-react";

import { Select } from "@components/ui/select";

interface StatusFilterSelectProps {
  value: string;
  options: { label: string; value: string; href: string }[];
}

// status filter as a dropdown, each option navigates to its own url
const StatusFilterSelect = ({ value, options }: StatusFilterSelectProps) => {
  const router = useRouter();

  return (
    <Select
      size="sm"
      ariaLabel="Filter lessons"
      icon={<Filter size={14} />}
      value={value}
      options={options}
      onChange={(next) => {
        const option = options.find((o) => o.value === next);
        if (option) router.push(option.href as Route);
      }}
      className="w-40"
    />
  );
};

export default StatusFilterSelect;
