"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/constants/routes";

import {
  type AvailabilityPayloadItem,
  type OwnAvailabilitySlot,
  type RecurringAvailabilityPayload,
  type TeacherAvailabilitySlot,
  api,
} from "@utils/api";

import { type ActionResult, actionError } from "./result";
import { getBackendSession } from "./session";

// server actions so the backend token stays on the server

const getTeacherToken = async (): Promise<string | null> =>
  (await getBackendSession("Teacher"))?.token ?? null;

const UNAUTHORIZED = {
  ok: false as const,
  error: "Only signed-in tutors can manage availability.",
};

const revalidateSchedulePages = () => {
  revalidatePath(ROUTES.DASHBOARD.AVAILABILITY);
  revalidatePath(ROUTES.DASHBOARD.TEACHER);
  revalidatePath(ROUTES.DASHBOARD.SCHEDULE);
};

export async function getMyAvailabilityAction(
  fromIso: string,
  toIso: string,
): Promise<ActionResult<OwnAvailabilitySlot[]>> {
  const token = await getTeacherToken();
  if (!token) return UNAUTHORIZED;

  try {
    const response = await api.availability.getMine(
      { from: new Date(fromIso), to: new Date(toIso) },
      token,
    );
    return { ok: true, data: response.data ?? [] };
  } catch (error) {
    return actionError(error, "Couldn't load your availability.");
  }
}

export async function createAvailabilityAction(
  items: AvailabilityPayloadItem[],
): Promise<ActionResult<TeacherAvailabilitySlot[]>> {
  const token = await getTeacherToken();
  if (!token) return UNAUTHORIZED;

  try {
    const response = await api.availability.createMany(items, token);
    revalidateSchedulePages();
    return { ok: true, data: response.data ?? [] };
  } catch (error) {
    return actionError(error, "Failed to save availability.");
  }
}

export async function createRecurringAvailabilityAction(
  payload: RecurringAvailabilityPayload,
): Promise<ActionResult<{ created: TeacherAvailabilitySlot[]; skipped: string[] }>> {
  const token = await getTeacherToken();
  if (!token) return UNAUTHORIZED;

  try {
    const response = await api.availability.createRecurring(payload, token);
    revalidateSchedulePages();
    return { ok: true, data: { created: response.data ?? [], skipped: response.skipped ?? [] } };
  } catch (error) {
    return actionError(error, "Failed to save availability.");
  }
}

// api allows max 50 ids per delete
const DELETE_BATCH_SIZE = 50;

export async function removeAvailabilityAction(ids: string[]): Promise<ActionResult> {
  const token = await getTeacherToken();
  if (!token) return UNAUTHORIZED;

  try {
    for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
      await api.availability.removeMany(ids.slice(i, i + DELETE_BATCH_SIZE), token);
    }
    revalidateSchedulePages();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Failed to remove availability.");
  }
}

export async function removeSeriesAction(
  seriesId: string,
): Promise<ActionResult<{ deleted: string[]; keptBooked: string[] }>> {
  const token = await getTeacherToken();
  if (!token) return UNAUTHORIZED;

  try {
    const response = await api.availability.removeSeries(seriesId, token);
    revalidateSchedulePages();
    return { ok: true, data: response.data ?? { deleted: [], keptBooked: [] } };
  } catch (error) {
    return actionError(error, "Failed to remove the series.");
  }
}
