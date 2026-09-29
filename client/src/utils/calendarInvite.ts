// builds an .ics file client side for "add to calendar"

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  durationMinutes: number;
  description?: string;
}

// iCal UTC timestamp: 20261005T160000Z
const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// ics text values need , ; \ and newlines escaped
const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export const buildIcs = (events: CalendarEvent[]): string => {
  const now = toIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GCSE Tutor//Lessons//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@gcse-tutor`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(event.start)}`,
      `DTEND:${toIcsDate(new Date(event.start.getTime() + event.durationMinutes * 60_000))}`,
      `SUMMARY:${escapeText(event.title)}`,
      ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(event.title)}`,
      "END:VALARM",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
};

export const downloadIcs = (events: CalendarEvent[], filename = "lessons.ics") => {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
