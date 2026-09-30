"use client";

import { AlertCircle, Clock, Info, Zap } from "lucide-react";
import type { SessionData } from "@/types/auth";
import type { Teacher } from "@/types/teacher";
import { Modal } from "@components/ui/modal";
import { addDaysToKey, formatUkDate, formatUkTime, toUkDateKey } from "@utils/ukTime";
import BookingCalendar from "./BookingCalendar";
import BookingSummary from "./BookingSummary";
import LessonDetailsForm from "./LessonDetailsForm";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "./ModalStates";
import TimeSlotPicker from "./TimeSlotPicker";
import { useBookLessonModal } from "./useBookLessonModal";

interface BookLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
  session: SessionData | null;
}

// "today at 21:35" / "tomorrow at 09:00" / "Fri 2 Oct at 09:00" (UK time)
const earliestBookable = (minNoticeHours: number) => {
  const earliest = new Date(Date.now() + minNoticeHours * 3_600_000);
  const todayKey = toUkDateKey(new Date());
  const dayKey = toUkDateKey(earliest);
  const time = formatUkTime(earliest);
  if (dayKey === todayKey) return `today at ${time}`;
  if (dayKey === addDaysToKey(todayKey, 1)) return `tomorrow at ${time}`;
  return `${formatUkDate(earliest, { weekday: "short", day: "numeric", month: "short" })} at ${time}`;
};

const BookLessonModal = ({ isOpen, onClose, teacher, session }: BookLessonModalProps) => {
  const booking = useBookLessonModal({ isOpen, teacher, session });
  const {
    slots,
    policy,
    requiresApproval,
    availableSubjects,
    isLoading,
    loadError,
    isSubmitting,
    bookedLessons,
    errorMessage,
    noticeMessage,
    selectedSlots,
    nextAvailable,
    pickSlot,
    selectedIds,
  } = booking;

  const handleClose = () => {
    booking.resetAfterSuccess();
    onClose();
  };

  const showBooking = !bookedLessons && !isLoading && !loadError && slots.length > 0;
  const showEmpty = !bookedLessons && !isLoading && !loadError && slots.length === 0;

  const renderFooter = () => {
    // success screen has its own buttons
    if (bookedLessons) return null;
    if (!showBooking && !isLoading) {
      return (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      );
    }
    return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-slate-400">{booking.getConfirmHint()}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={selectedSlots.length === 0 || isSubmitting || availableSubjects.length === 0}
          onClick={() => void booking.handleConfirmBooking()}
          className="cursor-pointer rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {booking.getConfirmButtonLabel()}
        </button>
      </div>
    </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      dismissible={!isSubmitting}
      size="max-w-4xl"
      title={`Book a lesson with ${teacher.name || "this tutor"}`}
      description={`£${teacher.hourlyRate}/hr · all times are UK time${
        requiresApproval ? " · this tutor confirms each booking" : ""
      }`}
      footer={renderFooter()}
    >
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {noticeMessage && !errorMessage && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
        >
          <Info size={16} className="shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {bookedLessons && (
        <SuccessState
          lessons={bookedLessons}
          teacherName={teacher.name}
          requiresApproval={requiresApproval}
          onDone={handleClose}
        />
      )}

      {!bookedLessons && isLoading && <LoadingState />}

      {!bookedLessons && !isLoading && loadError && (
        <ErrorState teacherName={teacher.name} onRetry={booking.retry} />
      )}

      {showEmpty && <EmptyState teacherName={teacher.name} policy={policy} />}

      {showBooking && (
        <div className="space-y-6">
          {/* explain why earlier slots (e.g. later today) aren't shown */}
          {policy && policy.minNoticeHours > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <Clock size={14} className="mt-0.5 shrink-0" />
              <span>
                {teacher.name ?? "This tutor"} needs at least {policy.minNoticeHours} hours&apos; notice, so the
                earliest you can book is <strong>{earliestBookable(policy.minNoticeHours)}</strong>.
              </span>
            </p>
          )}

          {/* quick picks for the next free slots */}
          <div>
            <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Zap size={12} /> Next available
            </span>
            <div className="flex flex-wrap gap-2">
              {nextAvailable.map((slot) => {
                const start = new Date(slot.startTime);
                const isSelected = selectedIds.has(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => pickSlot(slot)}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="block font-semibold">
                      {formatUkDate(start, { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className={isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}>
                      {formatUkTime(start)} – {formatUkTime(new Date(slot.endTime))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <BookingCalendar
              windowStartKey={booking.windowStartKey}
              calendarDays={booking.calendarDays}
              groupedSlots={booking.groupedSlots}
              selectedDateKey={booking.selectedDateKey}
              onSelectDate={booking.setSelectedDateKey}
              selectedCountByDate={booking.selectedCountByDate}
              todayKey={booking.todayKey}
              canGoPrev={booking.canGoPrev}
              canGoNext={booking.canGoNext}
              onPrev={booking.handlePrev}
              onNext={booking.handleNext}
            />

            <div className="flex flex-col space-y-5 lg:col-span-5">
              <TimeSlotPicker
                selectedDateKey={booking.selectedDateKey}
                groupedSlots={booking.groupedSlots}
                selectedIds={selectedIds}
                onToggleSlot={booking.toggleSlot}
              />

              <LessonDetailsForm
                subjects={availableSubjects}
                details={booking.activeDetails}
                onChange={booking.updateActiveDetails}
                hasActiveLesson={booking.activeSlotId !== null}
                selectedCount={selectedSlots.length}
                onApplyToAll={booking.applyDetailsToAll}
              />

              <BookingSummary
                selectedSlots={booking.sortedSelectedSlots}
                activeSlotId={booking.activeSlotId}
                onActivate={booking.setActiveSlotId}
                subjects={availableSubjects}
                getDetails={booking.getDetails}
                onSlotSubjectChange={booking.setSlotSubject}
                onRepeatWeekly={booking.repeatWeekly}
                teacherName={teacher.name}
                hourlyRate={teacher.hourlyRate}
                totalMinutes={booking.totalMinutes}
                estimatedCost={booking.estimatedCost}
                onRemoveSlot={booking.toggleSlot}
                policy={policy}
                requiresApproval={requiresApproval}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BookLessonModal;
