"use server";

import { auth } from "@auth";
import { revalidatePath } from "next/cache";
import { api, AvailabilityPayloadItem } from "@utils/api";

export interface TimeSlot {
	id: string;
	dayOfWeek: string; // "Monday" or ISO date "YYYY-MM-DD"
	startTime: string; // e.g., "10:00"
	endTime: string; // e.g., "11:00"
	date?: string; // e.g., "2026-08-17"
}

export interface SetAvailabilityInput {
	isRecurring: boolean;
	slots: TimeSlot[];
}

/**
 * Calculates duration in minutes from start and end time strings (HH:mm)
 */
const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
	const [startH, startM] = startTime.split(":").map(Number);
	const [endH, endM] = endTime.split(":").map(Number);

	const startMinutes = startH * 60 + startM;
	const endMinutes = endH * 60 + endM;

	return endMinutes - startMinutes;
};

/**
 * Converts local date and time string into an ISO 8601 string
 */
const toISOString = (dateStr: string, timeStr: string): string => {
	const [hours, minutes] = timeStr.split(":").map(Number);
	const date = new Date(dateStr);
	date.setHours(hours, minutes, 0, 0);
	return date.toISOString();
};

export async function setTeacherAvailability(input: SetAvailabilityInput) {
	const session = await auth();

	if (!session?.user || session.user.role !== "Teacher") {
		return { success: false, error: "Unauthorized. Teachers only." };
	}

	// Access user access token from session if available
	const token = session.backendToken || session.user?.backendJwt;

	try {
		const promises = input.slots.map(async (slot) => {
			const dateString = slot.date || new Date().toISOString().split("T")[0];
			const isoStartTime = toISOString(dateString, slot.startTime);
			const durationInMinutes = calculateDurationInMinutes(slot.startTime, slot.endTime);

			const payload: AvailabilityPayloadItem = {
				startTime: isoStartTime,
				durationInMinutes,
			};

			return api.availability.create(payload, token);
		});

		await Promise.all(promises);

		revalidatePath("/dashboard/schedule");

		return { success: true, message: "Availability updated successfully!" };
	} catch (error: unknown) {
		console.error("Failed to save availability:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to save availability.";
		return { success: false, error: errorMessage };
	}
}
