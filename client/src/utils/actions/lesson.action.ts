"use server";

import { auth } from "@auth";
import { revalidatePath } from "next/cache";
import { api } from "@utils/api";

export async function cancelLessonAction(
  lessonId: string,
): Promise<{ status: "success" | "error"; message?: string }> {
  const session = await auth();

  if (!session?.backendToken) {
    return {
      status: "error",
      message: "You must be logged in to cancel a lesson.",
    };
  }

  try {
    await api.lesson.cancel(lessonId, session.backendToken);
    revalidatePath("/dashboard/schedule");
    return { status: "success" };
  } catch (error: unknown) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to cancel the lesson.",
    };
  }
}
