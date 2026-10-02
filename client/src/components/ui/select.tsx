"use client";

import type { ReactNode } from "react";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@utils/cn";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  // optional icon shown before the value
  icon?: ReactNode;
  // sm for toolbars/cards, md for forms
  size?: "sm" | "md";
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

const triggerSizes = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-10 gap-2 px-3 text-sm",
};

// shared dropdown so every select in the app looks the same
export const Select = <T extends string | number>({
  value,
  onChange,
  options,
  icon,
  size = "md",
  id,
  ariaLabel,
  disabled,
  className,
}: SelectProps<T>) => (
  <BaseSelect.Root
    value={value}
    onValueChange={(next) => {
      if (next !== null) onChange(next as T);
    }}
    items={options}
    disabled={disabled}
  >
    <BaseSelect.Trigger
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full cursor-pointer items-center rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-xs transition-colors outline-none hover:border-slate-300 hover:bg-slate-50 focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:border-blue-500 data-popup-open:ring-3 data-popup-open:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
        triggerSizes[size],
        className,
      )}
    >
      {icon && <span className="shrink-0 text-blue-600 dark:text-blue-400">{icon}</span>}
      <BaseSelect.Value className="min-w-0 flex-1 truncate text-left" />
      <BaseSelect.Icon className="shrink-0 text-slate-400 transition-transform data-popup-open:rotate-180">
        <ChevronDown size={size === "sm" ? 14 : 16} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>

    <BaseSelect.Portal>
      {/* above modals (z-50) */}
      <BaseSelect.Positioner
        sideOffset={6}
        alignItemWithTrigger={false}
        className="z-70 outline-none"
      >
        <BaseSelect.Popup className="max-h-72 min-w-(--anchor-width) overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-blue-900/10 transition-[opacity,transform] duration-150 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-slate-800 dark:bg-slate-900">
          <BaseSelect.List>
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-slate-700 transition-colors outline-none select-none data-highlighted:bg-blue-50 data-highlighted:text-blue-700 data-selected:font-semibold data-selected:text-blue-700 dark:text-slate-200 dark:data-highlighted:bg-blue-500/10 dark:data-highlighted:text-blue-300",
                  size === "sm" ? "text-xs" : "text-sm",
                )}
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="text-blue-600 dark:text-blue-400">
                  <Check size={14} />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  </BaseSelect.Root>
);
