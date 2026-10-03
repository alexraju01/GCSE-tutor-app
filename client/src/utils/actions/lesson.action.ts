"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/constants/routes";
import type { BookingPolicy } from "@/types/teacher";

import { type LessonBookingPayloadItem, api } from "@utils/api";

import { type ActionResult, actionError } from "./result";
import { getBackendSession } from "./session";

const revalidateLessonPages = () => {
  revalidatePath(ROUTES.DASHBOARD.SCHEDULE);
  revalidatePath(ROUTES.DASHBOARD.TEACHER);
  revalidatePath(ROUTES.DASHBOARD.STUDENT);
  revalidatePath(ROUTES.DASHBOARD.AVAILABILITY);
  // lessons list + every lesson details page
  revalidatePath(ROUTES.DASHBOARD.LESSONS, "layout");
};

// booking goes through here so the backend token never reaches the browser
export async function bookLessonsAction(
  items: LessonBookingPayloadItem[],
  idempotencyKey: string,
): Promise<ActionResult<Lesson[]>> {
  const session = await getBackendSession();
  if (!session) return { ok: false, error: "You must be logged in to book a lesson." };

  try {
    const response = await api.lesson.create(items, session.token, idempotencyKey);
    revalidateLessonPages();
    return { ok: true, data: response.data ?? [] };
  } catch (error) {
    return actionError(error, "Something went wrong while booking.");
  }
}

export async function cancelLessonAction(
  lessonId: string,
  options: { reason?: string; reopenSlot?: boolean } = {},
): Promise<ActionResult> {
  const session = await getBackendSession();
  if (!session) return { ok: false, error: "You must be logged in to cancel a lesson." };

  try {
    await api.lesson.cancel(lessonId, session.token, {
      reason: options.reason?.trim() || undefined,
      // tutors only
      ...(session.role === "Teacher" && { reopenSlot: options.reopenSlot ?? false }),
    });
    revalidateLessonPages();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Failed to cancel the lesson.");
  }
}

export async function respondToLessonAction(
  lessonId: string,
  decision: "approve" | "decline",
  reason?: string,
): Promise<ActionResult> {
  const session = await getBackendSession("Teacher");
  if (!session) return { ok: false, error: "Only the lesson's tutor can respond to this request." };

  try {
    await api.lesson.respond(lessonId, session.token, decision, reason?.trim() || undefined);
    revalidateLessonPages();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Failed to respond to the request.");
  }
}

export async function updateBookingPolicyAction(
  policy: Partial<BookingPolicy>,
): Promise<ActionResult<BookingPolicy>> {
  const session = await getBackendSession("Teacher");
  if (!session) return { ok: false, error: "Only tutors can change booking settings." };

  try {
    const response = await api.teacher.updateMyBookingPolicy(policy, session.token);
    const teacher = response.data;
    revalidatePath(ROUTES.DASHBOARD.TEACHER_PROFILE);
    return {
      ok: true,
      data: {
        requireApproval: teacher?.requireApproval ?? false,
        minNoticeHours: teacher?.minNoticeHours ?? 0,
        maxAdvanceDays: teacher?.maxAdvanceDays ?? 0,
        cancellationCutoffHours: teacher?.cancellationCutoffHours ?? 0,
      },
    };
  } catch (error) {
    return actionError(error, "Failed to save booking settings.");
  }
}
