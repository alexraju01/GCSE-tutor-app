"use server";

import { auth } from "@auth";
import { revalidatePath } from "next/cache";

export interface TimeSlot {
	dayOfWeek: string; // e.g., "Monday", "Tuesday" or specific date "YYYY-MM-DD"
	startTime: string; // e.g., "09:00"
	endTime: string; // e.g., "17:00"
}

export interface SetAvailabilityInput {
	isRecurring: boolean;
	slots: TimeSlot[];
}

export async function setTeacherAvailability(input: SetAvailabilityInput) {
	const session = await auth();

	if (!session?.user || session.user.role !== "Teacher") {
		return { success: false, error: "Unauthorized. Teachers only." };
	}

	try {
		// TODO: Replace with your ORM / DB call (Prisma, Drizzle, MongoDB, etc.)
		// Example:
		// await db.availability.createMany({
		//   data: input.slots.map(slot => ({ ...slot, teacherId: session.user.id }))
		// });

		console.log("Saving availability for teacher:", session.user.id, input);

		// Revalidate dashboard schedule page to update UI instantly
		revalidatePath("/dashboard/schedule");

		return { success: true, message: "Availability updated successfully!" };
	} catch (error) {
		console.error("Failed to save availability:", error);
		return { success: false, error: "Failed to save availability." };
	}
}
