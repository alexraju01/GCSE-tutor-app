"use client";

import { AlertCircle, Info } from "lucide-react";
import type { Teacher } from "@/types/teacher";
import { Modal } from "@components/ui/modal";
import BookingCalendar from "./BookingCalendar";
import { MinimumNoticeNote, NextAvailable } from "./BookingHints";
import BookingSummary from "./BookingSummary";
import LessonDetailsForm from "./LessonDetailsForm";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "./ModalStates";
import TimeSlotPicker from "./TimeSlotPicker";
import { useBookLessonModal } from "./useBookLessonModal";

interface BookLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
}

const BookLessonModal = ({ isOpen, onClose, teacher }: BookLessonModalProps) => {
  const booking = useBookLessonModal({ isOpen, teacher });
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
          <MinimumNoticeNote booking={booking} />
          <NextAvailable booking={booking} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <BookingCalendar booking={booking} />

            <div className="flex flex-col space-y-5 lg:col-span-5">
              <TimeSlotPicker booking={booking} />

              <LessonDetailsForm booking={booking} />

              <BookingSummary booking={booking} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BookLessonModal;
