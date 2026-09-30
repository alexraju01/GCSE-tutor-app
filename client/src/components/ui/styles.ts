import { cn } from "@utils/cn";

// shared button + form field styles so every screen uses the same look.
// primary = brand gradient, everything is rounded-lg

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-xs",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
};

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) =>
  cn(buttonBase, buttonSizes[size], buttonVariants[variant], className);

// text inputs, date/time inputs and textareas (matches the shared Select)
export const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";

export const inputClass = cn(fieldClass, "h-10");
export const textareaClass = cn(fieldClass, "py-2");

export const labelClass = "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";
