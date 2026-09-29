"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AppNotification } from "@utils/api";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@utils/actions/notification.action";
import { cn } from "@utils/cn";

// polling + a check on tab focus - good enough for now, could move to SSE later
const POLL_MS = 15_000;
// cap toasts if a bunch arrive at once
const MAX_TOASTS = 3;

// page to open when a notification is clicked
const notificationHref = (notification: AppNotification) =>
  (notification.type === "LessonRequested"
    ? "/dashboard/schedule?filter=Pending"
    : "/dashboard/schedule") as Route;

const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const NotificationBell = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // ids we've already seen, null until first load so old ones don't toast
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let active = true;

    const poll = () => {
      void getNotificationsAction().then((result) => {
        if (!active || !result.ok) return;
        const { notifications: latest, unreadCount: unread } = result.data;

        const seen = seenIdsRef.current;
        const fresh = seen ? latest.filter((n) => !n.readAt && !seen.has(n.id)) : [];
        seenIdsRef.current = new Set(latest.map((n) => n.id));

        setNotifications(latest);
        setUnreadCount(unread);

        if (fresh.length > 0) {
          for (const notification of fresh.slice(0, MAX_TOASTS)) {
            toast.info(notification.title, {
              description: notification.body,
              action: { label: "View", onClick: () => router.push(notificationHref(notification)) },
            });
          }
          // refetch server data so the current page picks up the change
          router.refresh();
        }
      });
    };

    const pollWhenVisible = () => {
      if (document.visibilityState === "visible") poll();
    };

    poll();
    const timer = setInterval(pollWhenVisible, POLL_MS);
    document.addEventListener("visibilitychange", pollWhenVisible);
    window.addEventListener("focus", pollWhenVisible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", pollWhenVisible);
      window.removeEventListener("focus", pollWhenVisible);
    };
  }, [router]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const openNotification = async (notification: AppNotification) => {
    if (!notification.readAt) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      void markNotificationReadAction(notification.id);
    }
    setIsOpen(false);
    if (notification.lessonId) router.push(notificationHref(notification));
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    await markAllNotificationsReadAction();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={cn(
                      "flex w-full cursor-pointer gap-2.5 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60",
                      !notification.readAt && "bg-blue-50/50 dark:bg-blue-950/20",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        notification.readAt ? "bg-transparent" : "bg-blue-500",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block whitespace-pre-line text-[11px] text-slate-500 dark:text-slate-400">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">{timeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
