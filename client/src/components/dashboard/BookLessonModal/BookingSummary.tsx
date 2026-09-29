import { CalendarDays, Clock, Receipt, Repeat, ShieldCheck, X } from "lucide-react";
import type { BookingPolicy } from "@/types/teacher";
import { formatUkDate, formatUkTime, toUkDateKey } from "@utils/ukTime";
import type { LessonDetails, RawAvailability } from "./useBookLessonModal";

interface BookingSummaryProps {
  selectedSlots: RawAvailability[];
  activeSlotId: string | null;
  onActivate: (slotId: string) => void;
  subjects: string[];
  getDetails: (slotId: string) => LessonDetails;
  onSlotSubjectChange: (slotId: string, subject: string) => void;
  onRepeatWeekly: (slot: RawAvailability, weeks: number) => void;
  teacherName: string | null;
  hourlyRate: number;
  totalMinutes: number;
  estimatedCost: number;
  onRemoveSlot: (slot: RawAvailability) => void;
  policy: BookingPolicy | null;
  requiresApproval: boolean;
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const REPEAT_CHOICES = [3, 7, 11]; // extra weeks, so 4/8/12 in total

const slotMinutes = (slot: RawAvailability) =>
  Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000);

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

const displaySubject = (subject: string) => subject.replace(/_/g, " ");

const hoursLabel = (hours: number) =>
  hours % 24 === 0 && hours > 0 ? `${hours / 24} day${hours === 24 ? "" : "s"}` : `${hours} hours`;

const BookingSummary = ({
  selectedSlots,
  activeSlotId,
  onActivate,
  subjects,
  getDetails,
  onSlotSubjectChange,
  onRepeatWeekly,
  teacherName,
  hourlyRate,
  totalMinutes,
  estimatedCost,
  onRemoveSlot,
  policy,
  requiresApproval,
}: BookingSummaryProps) => {
  const lessonPrice = (slot: RawAvailability) => (hourlyRate * slotMinutes(slot)) / 60;

  // selectedSlots arrive sorted, so grouping preserves chronological order.
  const slotsByDate = new Map<string, RawAvailability[]>();
  for (const slot of selectedSlots) {
    const key = toUkDateKey(new Date(slot.startTime));
    slotsByDate.set(key, [...(slotsByDate.get(key) ?? []), slot]);
  }

  // Per-subject line items for the cost breakdown.
  const subjectTotals = new Map<string, { count: number; cost: number }>();
  for (const slot of selectedSlots) {
    const subject = getDetails(slot.id).subject;
    const current = subjectTotals.get(subject) ?? { count: 0, cost: 0 };
    subjectTotals.set(subject, { count: current.count + 1, cost: current.cost + lessonPrice(slot) });
  }

  const lessonCount = selectedSlots.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <Receipt size={14} className="text-blue-600 dark:text-blue-400" />
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">Booking Summary</span>
            {teacherName && (
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">with {teacherName}</span>
            )}
          </div>
        </div>
        {lessonCount > 0 && (
          <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
        )}
      </div>

      {lessonCount === 0 ? (
        <p className="px-4 py-5 text-center text-xs text-slate-400">
          Choose a date and one or more time slots to build your booking.
        </p>
      ) : (
        <div className="text-xs">
          <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
            {[...slotsByDate.entries()].map(([dateKey, daySlots]) => (
              <div key={dateKey}>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <CalendarDays size={12} />
                  {formatUkDate(new Date(daySlots[0].startTime), { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <ul className="space-y-1.5">
                  {daySlots.map((slot) => {
                    const lessonDetails = getDetails(slot.id);
                    const isActive = slot.id === activeSlotId;
                    return (
                      <li
                        key={slot.id}
                        className={`rounded-lg border px-3 py-2 ${
                          isActive
                            ? "border-blue-300 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30"
                            : "border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onActivate(slot.id)}
                            aria-pressed={isActive}
                            aria-label={`Edit details for ${formatUkTime(new Date(slot.startTime))} lesson`}
                            className="flex cursor-pointer items-center gap-1.5 text-left font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <Clock size={12} className="text-slate-400" />
                            {formatUkTime(new Date(slot.startTime))} – {formatUkTime(new Date(slot.endTime))}
                            <span className="font-normal text-slate-400">· {formatDuration(slotMinutes(slot))}</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {gbp.format(lessonPrice(slot))}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveSlot(slot)}
                              aria-label="Remove lesson"
                              className="shrink-0 cursor-pointer rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {subjects.length > 1 ? (
                            <select
                              value={lessonDetails.subject}
                              onChange={(e) => onSlotSubjectChange(slot.id, e.target.value)}
                              aria-label="Subject for this lesson"
                              className="cursor-pointer rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 focus:border-blue-500 focus:outline-hidden dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                            >
                              {subjects.map((sub) => (
                                <option key={sub} value={sub}>
                                  {displaySubject(sub)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {displaySubject(lessonDetails.subject)}
                            </span>
                          )}
                          {lessonDetails.topic && (
                            <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {lessonDetails.topic}
                            </span>
                          )}
                        </div>

                        {isActive && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-blue-100 pt-2 dark:border-blue-900/50">
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Repeat size={11} /> Same time weekly:
                            </span>
                            {REPEAT_CHOICES.map((weeks) => (
                              <button
                                key={weeks}
                                type="button"
                                onClick={() => onRepeatWeekly(slot, weeks)}
                                className="cursor-pointer rounded-md border border-blue-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300"
                              >
                                {weeks + 1} weeks
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/20">
            {[...subjectTotals.entries()].map(([subject, { count, cost }]) => (
              <div key={subject} className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {displaySubject(subject)} × {count}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{gbp.format(cost)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Total time</span>
              <span>
                {formatDuration(totalMinutes)} at {gbp.format(hourlyRate)}/hr
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Estimated total</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">{gbp.format(estimatedCost)}</span>
            </div>
          </div>

          {/* booking/cancellation policy */}
          {policy && (
            <div className="flex gap-2 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p>
                {requiresApproval
                  ? `${teacherName ?? "Your tutor"} reviews each request — you'll be notified when they accept. `
                  : "Your lessons are confirmed straight away. "}
                {policy.cancellationCutoffHours === 0
                  ? "Free cancellation any time before each lesson."
                  : `Free cancellation until ${hoursLabel(policy.cancellationCutoffHours)} before each lesson.`}{" "}
                Times are UK time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingSummary;
