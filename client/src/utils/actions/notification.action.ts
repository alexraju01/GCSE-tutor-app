"use server";

import { auth } from "@auth";
import { api, type AppNotification } from "@utils/api";
import { actionError, type ActionResult } from "./result";

export async function getNotificationsAction(): Promise<
  ActionResult<{ notifications: AppNotification[]; unreadCount: number }>
> {
  const session = await auth();
  if (!session?.backendToken) return { ok: false, error: "Not signed in." };

  try {
    const response = await api.notifications.getMine(session.backendToken);
    return {
      ok: true,
      data: { notifications: response.data ?? [], unreadCount: response.unreadCount ?? 0 },
    };
  } catch (error) {
    return actionError(error, "Couldn't load notifications.");
  }
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.backendToken) return { ok: false, error: "Not signed in." };

  try {
    await api.notifications.markRead(id, session.backendToken);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Couldn't update the notification.");
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.backendToken) return { ok: false, error: "Not signed in." };

  try {
    await api.notifications.markAllRead(session.backendToken);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Couldn't update notifications.");
  }
}
