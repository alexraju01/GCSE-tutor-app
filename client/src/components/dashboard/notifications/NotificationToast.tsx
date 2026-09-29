"use client";

import { GraduationCap, X } from "lucide-react";

import type { AppNotification } from "@utils/api";
import { cn } from "@utils/cn";
import { NOTIFICATION_STYLES } from "./notificationStyle";

interface NotificationToastProps {
  notification: AppNotification;
  onView: () => void;
  onDismiss: () => void;
}

// branded card rendered through toast.custom
const NotificationToast = ({ notification, onView, onDismiss }: NotificationToastProps) => {
  const style = NOTIFICATION_STYLES[notification.type];
  const Icon = style.icon;

  return (
    <div
      role="status"
      className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-blue-900/10 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="h-1 bg-linear-to-r from-blue-600 to-indigo-600" />

      <div className="flex gap-3 p-4">
        <div className="relative shrink-0">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", style.iconClass)}>
            <Icon size={18} />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white ring-2 ring-white dark:ring-slate-900">
            <GraduationCap size={10} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            GCSE Ace · {style.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
          <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-xs text-slate-500 dark:text-slate-400">
            {notification.body}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onView}
              className="cursor-pointer rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:from-blue-700 hover:to-indigo-700"
            >
              View
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="h-fit cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
