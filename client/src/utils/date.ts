// @utils/date.ts

export const formatScheduleDate = (dateInput: string | Date) => {
	const startDate = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

	const formattedDate = startDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	const startTimeStr = startDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	return { startDate, formattedDate, startTimeStr };
};

export const formatTimeRange = (startDate: Date, durationMinutes: number) => {
	const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

	const startTimeStr = startDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	const endTimeStr = endDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	return `${startTimeStr} - ${endTimeStr}`;
};

export const formatHeaderDate = (year: number, monthIndex?: number): string => {
	if (monthIndex !== undefined && monthIndex >= 0) {
		const activeDate = new Date(year, monthIndex, 1);
		return activeDate.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	}
	return `${year}`;
};
