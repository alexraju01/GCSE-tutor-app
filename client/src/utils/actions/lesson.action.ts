"use server";

import { auth } from "@auth";
import { revalidatePath } from "next/cache";
import { api } from "@utils/api";
import type { BookingPolicy } from "@/types/teacher";
import { actionError, type ActionResult } from "./result";

const revalidateLessonPages = () => {
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/availability");
};

export async function cancelLessonAction(
  lessonId: string,
  options: { reason?: string; reopenSlot?: boolean } = {},
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.backendToken) {
    return { ok: false, error: "You must be logged in to cancel a lesson." };
  }

  try {
    await api.lesson.cancel(lessonId, session.backendToken, {
      reason: options.reason?.trim() || undefined,
      // tutors only
      ...(session.user?.role === "Teacher" && { reopenSlot: options.reopenSlot ?? false }),
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
  const session = await auth();

  if (session?.user?.role !== "Teacher" || !session.backendToken) {
    return { ok: false, error: "Only the lesson's tutor can respond to this request." };
  }

  try {
    await api.lesson.respond(lessonId, session.backendToken, decision, reason?.trim() || undefined);
    revalidateLessonPages();
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Failed to respond to the request.");
  }
}

export async function updateBookingPolicyAction(
  policy: Partial<BookingPolicy>,
): Promise<ActionResult<BookingPolicy>> {
  const session = await auth();

  if (session?.user?.role !== "Teacher" || !session.backendToken) {
    return { ok: false, error: "Only tutors can change booking settings." };
  }

  try {
    const response = await api.teacher.updateMyBookingPolicy(policy, session.backendToken);
    const teacher = response.data;
    revalidatePath("/dashboard/teacher/profile");
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
