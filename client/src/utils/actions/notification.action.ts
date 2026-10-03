"use server";

import { type AppNotification, api } from "@utils/api";

import { type ActionResult, actionError } from "./result";
import { getBackendSession } from "./session";

const SIGNED_OUT = { ok: false as const, error: "Not signed in." };

export async function getNotificationsAction(): Promise<
  ActionResult<{ notifications: AppNotification[]; unreadCount: number }>
> {
  const session = await getBackendSession();
  if (!session) return SIGNED_OUT;

  try {
    const response = await api.notifications.getMine(session.token);
    return {
      ok: true,
      data: { notifications: response.data ?? [], unreadCount: response.unreadCount ?? 0 },
    };
  } catch (error) {
    return actionError(error, "Couldn't load notifications.");
  }
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const session = await getBackendSession();
  if (!session) return SIGNED_OUT;

  try {
    await api.notifications.markRead(id, session.token);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Couldn't update the notification.");
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await getBackendSession();
  if (!session) return SIGNED_OUT;

  try {
    await api.notifications.markAllRead(session.token);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Couldn't update notifications.");
  }
}
