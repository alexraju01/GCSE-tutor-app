import { CalendarDays, Clock, Receipt, Repeat, ShieldCheck, X } from "lucide-react";
import { Select } from "@components/ui/select";
import { slotMinutes } from "@utils/date";
import { formatDuration, formatHours, formatMoney, formatSubject } from "@utils/format";
import { formatUkDate, formatUkTime, toUkDateKey } from "@utils/ukTime";
import type { BookingState, RawAvailability } from "./useBookLessonModal";

const REPEAT_CHOICES = [3, 7, 11]; // extra weeks, so 4/8/12 in total

const BookingSummary = ({ booking }: { booking: BookingState }) => {
  const {
    sortedSelectedSlots: selectedSlots,
    activeSlotId,
    setActiveSlotId: onActivate,
    availableSubjects: subjects,
    getDetails,
    setSlotSubject: onSlotSubjectChange,
    repeatWeekly: onRepeatWeekly,
    teacher,
    totalMinutes,
    estimatedCost,
    toggleSlot: onRemoveSlot,
    policy,
    requiresApproval,
  } = booking;
  const teacherName = teacher.name;
  const hourlyRate = teacher.hourlyRate;
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
                              {formatMoney(lessonPrice(slot))}
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
                            <Select
                              size="sm"
                              ariaLabel="Subject for this lesson"
                              value={lessonDetails.subject}
                              onChange={(subject) => onSlotSubjectChange(slot.id, subject)}
                              options={subjects.map((sub) => ({ value: sub, label: formatSubject(sub) }))}
                              className="w-auto min-w-36"
                            />
                          ) : (
                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              {formatSubject(lessonDetails.subject)}
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
                  {formatSubject(subject)} × {count}
                </span>
                <span className="text-slate-700 dark:text-slate-300">{formatMoney(cost)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Total time</span>
              <span>
                {formatDuration(totalMinutes)} at {formatMoney(hourlyRate)}/hr
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Estimated total</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">{formatMoney(estimatedCost)}</span>
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
                  : `Free cancellation until ${formatHours(policy.cancellationCutoffHours)} before each lesson.`}{" "}
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
