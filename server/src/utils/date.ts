// @utils/date.ts

export const formatDateLabel = (startTime: Date): string => {
  return startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatTimeSlot = (startTime: Date, durationMinutes: number): string => {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const startFormatted = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endFormatted = endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${startFormatted} - ${endFormatted}`;
};

export const formatDurationLabel = (durationMinutes: number): string => {
  const hours = durationMinutes / 60;
  return hours === 1 ? "1 hr" : `${hours} hrs`;
};

export const formatSessionTime = (startTime: Date, durationMinutes: number): string => {
  const isToday = startTime.toDateString() === new Date().toDateString();
  const dayLabel = isToday ? "Today" : formatDateLabel(startTime);
  const slot = formatTimeSlot(startTime, durationMinutes);

  return `${dayLabel}, ${slot}`;
};

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
