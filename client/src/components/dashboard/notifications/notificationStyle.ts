import { CalendarCheck, CalendarX, CircleCheck, CircleX, Inbox, type LucideIcon } from "lucide-react";
import type { Route } from "next";

import type { AppNotification } from "@utils/api";

interface NotificationStyle {
  label: string;
  icon: LucideIcon;
  // icon bubble colours
  iconClass: string;
  // accent used for the unread marker / toast edge
  accentClass: string;
}

export const NOTIFICATION_STYLES: Record<AppNotification["type"], NotificationStyle> = {
  LessonBooked: {
    label: "New booking",
    icon: CalendarCheck,
    iconClass: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20",
    accentClass: "bg-blue-600",
  },
  LessonRequested: {
    label: "Booking request",
    icon: Inbox,
    iconClass: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20",
    accentClass: "bg-amber-500",
  },
  LessonConfirmed: {
    label: "Lesson confirmed",
    icon: CircleCheck,
    iconClass:
      "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
    accentClass: "bg-emerald-500",
  },
  LessonDeclined: {
    label: "Request declined",
    icon: CircleX,
    iconClass: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/20",
    accentClass: "bg-slate-400",
  },
  LessonCancelled: {
    label: "Lesson cancelled",
    icon: CalendarX,
    iconClass: "bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20",
    accentClass: "bg-rose-500",
  },
};

// page to open when a notification is clicked
export const notificationHref = (notification: AppNotification) =>
  (notification.type === "LessonRequested"
    ? "/dashboard/schedule?filter=Pending"
    : "/dashboard/schedule?filter=all") as Route;

export const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};
