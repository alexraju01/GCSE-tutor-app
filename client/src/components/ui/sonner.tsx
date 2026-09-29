"use client";

import { CircleCheck, Info, Loader2, OctagonX, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "@utils/cn";

// coloured icon bubble, same style as the notification bell
export const ToastIcon = ({ className, children }: { className: string; children: ReactNode }) => (
  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", className)}>
    {children}
  </span>
);

// GCSE Ace branded toasts - used for every toast in the app
const Toaster = (props: ToasterProps) => (
  <Sonner
    position="top-right"
    closeButton
    gap={10}
    icons={{
      success: (
        <ToastIcon className="bg-emerald-50 text-emerald-600 ring-emerald-100">
          <CircleCheck size={17} />
        </ToastIcon>
      ),
      info: (
        <ToastIcon className="bg-blue-50 text-blue-600 ring-blue-100">
          <Info size={17} />
        </ToastIcon>
      ),
      warning: (
        <ToastIcon className="bg-amber-50 text-amber-600 ring-amber-100">
          <TriangleAlert size={17} />
        </ToastIcon>
      ),
      error: (
        <ToastIcon className="bg-rose-50 text-rose-600 ring-rose-100">
          <OctagonX size={17} />
        </ToastIcon>
      ),
      loading: (
        <ToastIcon className="bg-blue-50 text-blue-600 ring-blue-100">
          <Loader2 size={17} className="animate-spin" />
        </ToastIcon>
      ),
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        // brand gradient bar on the left, swapped for the type colour below
        toast:
          "group relative flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white py-3.5 pl-5 pr-9 font-sans shadow-xl shadow-blue-900/10 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-linear-to-b before:from-blue-600 before:to-indigo-600 data-[type=success]:before:from-emerald-500 data-[type=success]:before:to-emerald-500 data-[type=error]:before:from-rose-500 data-[type=error]:before:to-rose-500 data-[type=warning]:before:from-amber-500 data-[type=warning]:before:to-amber-500",
        icon: "mt-0.5 shrink-0",
        content: "min-w-0 flex-1",
        title: "text-sm font-semibold text-slate-900",
        description: "mt-0.5 whitespace-pre-line text-xs text-slate-500",
        actionButton:
          "mt-2.5 cursor-pointer rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700",
        cancelButton:
          "mt-2.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100",
        closeButton:
          "absolute right-2.5 top-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600",
      },
    }}
    {...props}
  />
);

export { Toaster };
