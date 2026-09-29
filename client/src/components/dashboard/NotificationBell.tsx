"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AppNotification } from "@utils/api";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@utils/actions/notification.action";
import { cn } from "@utils/cn";
import { ToastIcon } from "@components/ui/sonner";
import { NOTIFICATION_STYLES, notificationHref, timeAgo } from "./notifications/notificationStyle";

// polling + a check on tab focus - good enough for now, could move to SSE later
const POLL_MS = 15_000;
// cap toasts if a bunch arrive at once
const MAX_TOASTS = 3;
// cancellations stay up longer so they're hard to miss
const TOAST_MS = 8_000;
const CANCELLED_TOAST_MS = 20_000;

// toast variant per type, sets the coloured edge on the branded toast
const TOAST_BY_TYPE: Record<AppNotification["type"], typeof toast.info> = {
  LessonBooked: toast.info,
  LessonRequested: toast.warning,
  LessonConfirmed: toast.success,
  LessonDeclined: toast,
  LessonCancelled: toast.error,
};

const NotificationBell = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // ids we've already seen, null until first load so old ones don't toast
  const seenIdsRef = useRef<Set<string> | null>(null);

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    void markNotificationReadAction(id);
  };

  // kept in a ref so the polling effect doesn't restart every render
  const markReadRef = useRef(markRead);
  useEffect(() => {
    markReadRef.current = markRead;
  });

  useEffect(() => {
    let active = true;

    const showToast = (notification: AppNotification) => {
      const style = NOTIFICATION_STYLES[notification.type];
      const Icon = style.icon;
      const show = TOAST_BY_TYPE[notification.type];

      show(
        <span className="block">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-blue-600">
            GCSE Ace · {style.label}
          </span>
          <span className="mt-0.5 block">{notification.title}</span>
        </span>,
        {
          description: notification.body,
          icon: (
            <ToastIcon className={style.iconClass}>
              <Icon size={17} />
            </ToastIcon>
          ),
          action: {
            label: "View",
            onClick: () => {
              markReadRef.current(notification.id);
              router.push(notificationHref(notification));
            },
          },
          duration: notification.type === "LessonCancelled" ? CANCELLED_TOAST_MS : TOAST_MS,
        },
      );
    };

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
          fresh.slice(0, MAX_TOASTS).forEach(showToast);
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

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) markRead(notification.id);
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
        className={cn(
          "relative rounded-lg border p-2 transition-colors",
          isOpen || unreadCount > 0
            ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
        )}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0b0f19]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-1 bg-linear-to-r from-blue-600 to-indigo-600" />

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                <GraduationCap size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <Bell size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No notifications yet</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Bookings, requests and cancellations will show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-104 overflow-y-auto">
              {notifications.map((notification) => {
                const style = NOTIFICATION_STYLES[notification.type];
                const Icon = style.icon;
                const isUnread = !notification.readAt;

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={cn(
                        "relative flex w-full cursor-pointer gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60",
                        isUnread && "bg-blue-50/40 dark:bg-blue-500/5",
                      )}
                    >
                      {isUnread && <span className={cn("absolute inset-y-0 left-0 w-1", style.accentClass)} />}
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                          style.iconClass,
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {style.label}
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {timeAgo(notification.createdAt)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-xs text-slate-900 dark:text-slate-100",
                            isUnread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {notification.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block whitespace-pre-line text-[11px] text-slate-500 dark:text-slate-400">
                          {notification.body}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <Link
              href="/dashboard/schedule?filter=all"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Go to my schedule
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
