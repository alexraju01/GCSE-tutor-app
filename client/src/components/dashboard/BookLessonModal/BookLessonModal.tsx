"use client";

import { AlertCircle, X } from "lucide-react";
import type { SessionData } from "@/types/auth";
import type { Teacher } from "@/types/teacher";
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

const BookLessonModal = ({
  isOpen,
  onClose,
  teacher,
  session,
}: BookLessonModalProps) => {
  const {
    slots,
    availableSubjects,
    isLoading,
    loadError,
    isSubmitting,
    bookingSuccess,
    errorMessage,
    selectedSlots,
    bookedCount,
    selectedDateKey,
    setSelectedDateKey,
    currentMonth,
    subject,
    setSubject,
    topic,
    setTopic,
    notes,
    setNotes,
    groupedSlots,
    todayKey,
    calendarDays,
    canGoPrevMonth,
    canGoNextMonth,
    sortedSelectedSlots,
    selectedIds,
    selectedCountByDate,
    estimatedCost,
    toggleSlot,
    getConfirmHint,
    getConfirmButtonLabel,
    handlePrevMonth,
    handleNextMonth,
    handleConfirmBooking,
    resetAfterSuccess,
    retry,
  } = useBookLessonModal({ isOpen, teacher, session });

  const handleConfirm = async () => {
    const success = await handleConfirmBooking();
    if (success) {
      // Give the confirmation a moment to register before closing, instead
      // of the modal just vanishing with no feedback that it worked.
      setTimeout(() => {
        resetAfterSuccess();
        onClose();
      }, 1800);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-lesson-modal-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div>
            <h2
              id="book-lesson-modal-title"
              className="text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              Book Lesson with {teacher.name || "Teacher"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select an available date, time slot, and lesson subject (£
              {teacher.hourlyRate}/hr).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {bookingSuccess && (
            <SuccessState bookedCount={bookedCount} subject={subject} />
          )}

          {!bookingSuccess && isLoading && <LoadingState />}

          {!bookingSuccess && !isLoading && loadError && (
            <ErrorState teacherName={teacher.name} onRetry={retry} />
          )}

          {!bookingSuccess && !isLoading && !loadError && slots.length === 0 && (
            <EmptyState teacherName={teacher.name} />
          )}

          {!bookingSuccess && !isLoading && slots.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <BookingCalendar
                currentMonth={currentMonth}
                calendarDays={calendarDays}
                groupedSlots={groupedSlots}
                selectedDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
                selectedCountByDate={selectedCountByDate}
                todayKey={todayKey}
                canGoPrevMonth={canGoPrevMonth}
                canGoNextMonth={canGoNextMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />

              <div className="lg:col-span-5 flex flex-col space-y-5">
                <TimeSlotPicker
                  selectedDateKey={selectedDateKey}
                  groupedSlots={groupedSlots}
                  selectedIds={selectedIds}
                  onToggleSlot={toggleSlot}
                />

                <LessonDetailsForm
                  subjects={availableSubjects}
                  subject={subject}
                  onSubjectChange={setSubject}
                  topic={topic}
                  onTopicChange={setTopic}
                  notes={notes}
                  onNotesChange={setNotes}
                />

                <BookingSummary
                  selectedSlots={sortedSelectedSlots}
                  subject={subject}
                  estimatedCost={estimatedCost}
                  onRemoveSlot={toggleSlot}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!bookingSuccess && !isLoading && slots.length === 0 && (
          <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        )}

        {!bookingSuccess && (isLoading || slots.length > 0) && (
          <div className="border-t border-slate-100 p-5 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-400">{getConfirmHint()}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  selectedSlots.length === 0 ||
                  isSubmitting ||
                  availableSubjects.length === 0 ||
                  !subject
                }
                onClick={handleConfirm}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {getConfirmButtonLabel()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLessonModal;
