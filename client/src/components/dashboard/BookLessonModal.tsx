"use client";

import { useEffect, useState, useMemo, useRef, ChangeEvent } from "react";
import {
  ChevronDown,
  Clock,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import type { SessionData } from "@/types/auth";
import { api, type TeacherAvailabilitySlot } from "@utils/api";

type RawAvailability = TeacherAvailabilitySlot;

interface TeacherProfile {
  id: string;
  subjects?: string[];
}

interface BookLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string | null;
  hourlyRate: number;
  session: SessionData | null;
  teacherSubjects?: string[];
}

const MAX_BATCH_SIZE = 20;

const BookLessonModal = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  hourlyRate,
  session,
  teacherSubjects,
}: BookLessonModalProps) => {
  const [slots, setSlots] = useState<RawAvailability[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(
    teacherSubjects || [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<RawAvailability[]>([]);
  const [bookedCount, setBookedCount] = useState<number>(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Lesson specific details
  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubjectOpen, setIsSubjectOpen] = useState<boolean>(false);
  const subjectMenuRef = useRef<HTMLDivElement>(null);

  const token = session?.backendToken;

  useEffect(() => {
    if (!isSubjectOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!subjectMenuRef.current?.contains(e.target as Node)) {
        setIsSubjectOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsSubjectOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubjectOpen]);

  useEffect(() => {
    if (!isOpen || !teacherId) return;

    const fetchTeacherDetailsAndSlots = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Fetch slots and teacher profile concurrently if subjects weren't provided as a prop
        // limit=100 (the server's max) so a teacher with lots of open slots
        // doesn't silently get cut off after the default page size of 10.
        const slotsPromise = api.teacher.getAvailabilities(
          teacherId,
          { limit: 100 },
          token,
        );

        // A failed profile lookup shouldn't block booking; fall back to no subjects.
        const teacherPromise = !teacherSubjects
          ? api.teacher.getOne(teacherId, token).catch(() => null)
          : Promise.resolve(null);

        const [slotsResult, teacherResult] = await Promise.all([
          slotsPromise,
          teacherPromise,
        ]);

        const loadedSlots: RawAvailability[] = slotsResult.data || [];
        setSlots(loadedSlots);

        let fetchedSubjects: string[] = teacherSubjects || [];
        if (teacherResult) {
          const profile = (teacherResult.data ||
            teacherResult) as TeacherProfile;
          fetchedSubjects = profile.subjects || [];
        }

        setAvailableSubjects(fetchedSubjects);
        if (fetchedSubjects.length > 0) {
          setSubject(fetchedSubjects[0]);
        }

        if (loadedSlots.length > 0) {
          const firstSlotDate = new Date(loadedSlots[0].startTime);
          const firstDateKey = firstSlotDate.toISOString().split("T")[0];
          setSelectedDateKey(firstDateKey);
          setCurrentMonth(
            new Date(firstSlotDate.getFullYear(), firstSlotDate.getMonth(), 1),
          );
        }
      } catch (err) {
        console.error(
          "Failed to load availability slots or teacher info:",
          err,
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTeacherDetailsAndSlots();
  }, [isOpen, teacherId, token, teacherSubjects]);

  const groupedSlots = useMemo(() => {
    const groups: Record<string, RawAvailability[]> = {};

    slots.forEach((slot) => {
      const dateKey = new Date(slot.startTime).toISOString().split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    });

    return groups;
  }, [slots]);

  const todayKey = new Date().toISOString().split("T")[0];

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const totalDays = lastDayOfMonth.getDate();
    const daysArr: (Date | null)[] = [];

    for (let i = 0; i < startDayIndex; i++) {
      daysArr.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      daysArr.push(new Date(year, month, day));
    }

    // Always pad to a fixed 6 rows (42 cells) so the grid is the same
    // height every month — a 4-week Feb and a 6-week Oct would otherwise
    // render at different heights and shift everything below them.
    while (daysArr.length < 42) {
      daysArr.push(null);
    }

    return daysArr;
  }, [currentMonth]);

  // Bound month navigation to where real availability actually is, so you
  // can't page through a year of empty months hunting for the next slot.
  const monthBounds = useMemo(() => {
    if (slots.length === 0) return null;

    const times = slots.map((slot) => new Date(slot.startTime).getTime());
    const earliest = new Date(Math.min(...times));
    const latest = new Date(Math.max(...times));

    return {
      min: new Date(earliest.getFullYear(), earliest.getMonth(), 1),
      max: new Date(latest.getFullYear(), latest.getMonth(), 1),
    };
  }, [slots]);

  const canGoPrevMonth = monthBounds ? currentMonth > monthBounds.min : false;
  const canGoNextMonth = monthBounds ? currentMonth < monthBounds.max : false;

  const sortedSelectedSlots = useMemo(
    () =>
      [...selectedSlots].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [selectedSlots],
  );

  const selectedIds = useMemo(
    () => new Set(selectedSlots.map((s) => s.id)),
    [selectedSlots],
  );

  const selectedCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedSlots.forEach((slot) => {
      const key = new Date(slot.startTime).toISOString().split("T")[0];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [selectedSlots]);

  const totalMinutes = selectedSlots.reduce(
    (sum, slot) =>
      sum +
      Math.round(
        (new Date(slot.endTime).getTime() -
          new Date(slot.startTime).getTime()) /
          60000,
      ),
    0,
  );
  const estimatedCost = (hourlyRate * totalMinutes) / 60;

  const toggleSlot = (slot: RawAvailability) => {
    setErrorMessage(null);
    setSelectedSlots((prev) => {
      if (prev.some((s) => s.id === slot.id)) {
        return prev.filter((s) => s.id !== slot.id);
      }
      if (prev.length >= MAX_BATCH_SIZE) {
        setErrorMessage(
          `You can book at most ${MAX_BATCH_SIZE} lessons at once.`,
        );
        return prev;
      }
      return [...prev, slot];
    });
  };

  const getConfirmHint = (): string | null => {
    if (selectedSlots.length === 0)
      return "Select one or more time slots to continue.";
    if (!subject) return "Choose a subject to continue.";
    return `${selectedSlots.length} ${
      selectedSlots.length === 1 ? "lesson" : "lessons"
    } selected.`;
  };

  const getDayCellClasses = (
    hasAvailability: boolean,
    isSelected: boolean,
  ): string => {
    if (!hasAvailability) {
      return "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40 bg-slate-50/50 dark:bg-slate-900/50";
    }
    if (isSelected) {
      return "bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md cursor-pointer scale-[1.02]";
    }
    return "bg-blue-50/80 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold cursor-pointer border border-blue-100/50 dark:border-blue-900/30";
  };

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleConfirmBooking = async () => {
    if (selectedSlots.length === 0) return;

    if (!token) {
      setErrorMessage("You must be logged in to book a lesson.");
      return;
    }

    if (!subject) {
      setErrorMessage("Please select a subject for the lesson.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.lesson.create(
        selectedSlots.map((slot) => ({
          teacherProfileId: teacherId,
          availabilityId: slot.id,
          subject,
          topic: topic || undefined,
          notes: notes || undefined,
        })),
        token,
      );

      const bookedIds = new Set(selectedSlots.map((s) => s.id));
      setBookedCount(selectedSlots.length);
      setSlots((prev) => prev.filter((s) => !bookedIds.has(s.id)));
      setBookingSuccess(true);

      // Give the confirmation a moment to register before closing, instead
      // of the modal just vanishing with no feedback that it worked.
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedSlots([]);
        setTopic("");
        setNotes("");
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Booking error:", error);
      setErrorMessage(error.message || "Something went wrong while booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Book Lesson with {teacherName || "Teacher"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select an available date, time slot, and lesson subject (£
              {hourlyRate}/hr).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <Check size={32} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                {bookedCount === 1 ? "Booking confirmed!" : "Bookings confirmed!"}
              </h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                {bookedCount === 1
                  ? `Your ${subject} lesson is booked.`
                  : `${bookedCount} ${subject} lessons are booked.`}{" "}
                You&apos;ll find {bookedCount === 1 ? "it" : "them"} on your
                schedule.
              </p>
            </div>
          )}

          {!bookingSuccess && isLoading && (
            <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading availability calendar...
            </div>
          )}

          {!bookingSuccess && !isLoading && slots.length === 0 && (
            <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
              No available slots found for this teacher.
            </div>
          )}

          {!bookingSuccess && !isLoading && slots.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Calendar Grid */}
              <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    1. Select Date
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {currentMonth.toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={!canGoPrevMonth}
                        aria-label="Previous month"
                        className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        disabled={!canGoNextMonth}
                        aria-label="Next month"
                        className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <span
                        key={day}
                        className="text-xs font-semibold text-slate-400 uppercase tracking-wide"
                      >
                        {day}
                      </span>
                    ),
                  )}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, idx) => {
                    if (!date) {
                      return (
                        <div key={`empty-${idx}`} className="h-12 w-full" />
                      );
                    }

                    const dateKey = date.toISOString().split("T")[0];
                    const slotCount = groupedSlots[dateKey]?.length || 0;
                    const hasAvailability = slotCount > 0;
                    const isSelected = selectedDateKey === dateKey;
                    const isToday = dateKey === todayKey;
                    const pickedCount = selectedCountByDate[dateKey] || 0;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!hasAvailability}
                        onClick={() => setSelectedDateKey(dateKey)}
                        className={`h-12 w-full rounded-xl text-xs flex flex-col items-center justify-center relative transition-all ${
                          isToday
                            ? "ring-2 ring-offset-1 ring-blue-400 dark:ring-offset-slate-900"
                            : ""
                        } ${getDayCellClasses(hasAvailability, isSelected)}`}
                      >
                        <span className="text-sm">{date.getDate()}</span>
                        {hasAvailability && (
                          <span
                            className={`text-[9px] mt-0.5 px-1 rounded-full font-medium ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {slotCount} {slotCount === 1 ? "slot" : "slots"}
                          </span>
                        )}
                        {pickedCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white shadow-sm">
                            {pickedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Time Slot & Subject Selection */}
              <div className="lg:col-span-5 flex flex-col space-y-5">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    2. Select Time Slots (pick as many as you like)
                  </span>

                  {/* Fixed height regardless of slot count or selection state, so
									    switching days never shifts the layout below it. */}
                  <div className="h-[180px] overflow-y-auto pr-1">
                    {selectedDateKey && groupedSlots[selectedDateKey] ? (
                      <div className="space-y-2">
                        {groupedSlots[selectedDateKey].map((slot) => {
                          const isSelected = selectedIds.has(slot.id);
                          const start = new Date(slot.startTime);
                          const end = new Date(slot.endTime);

                          const startTimeFormatted = start.toLocaleTimeString(
                            "en-GB",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          );

                          const endTimeFormatted = end.toLocaleTimeString(
                            "en-GB",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          );

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => toggleSlot(slot)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "border-transparent bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-semibold"
                                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-950/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Clock
                                  size={14}
                                  className={
                                    isSelected ? "text-white" : "text-slate-400"
                                  }
                                />
                                <span>
                                  {startTimeFormatted} - {endTimeFormatted}
                                </span>
                              </div>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="text-white shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-xs text-slate-400">
                          Select a highlighted date to view time slots.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Context Inputs */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    3. Lesson Details
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <div className="relative" ref={subjectMenuRef}>
                      {availableSubjects.length > 0 ? (
                        <>
                          <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={isSubjectOpen}
                            onClick={() => setIsSubjectOpen((open) => !open)}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl border bg-slate-50 p-2.5 pl-9 pr-3 text-left text-xs text-slate-900 transition-colors focus:outline-hidden dark:bg-slate-950 dark:text-slate-100 ${
                              isSubjectOpen
                                ? "border-blue-600 bg-white dark:border-blue-600"
                                : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                            }`}
                          >
                            <span className="truncate">{subject}</span>
                            <ChevronDown
                              size={14}
                              className={`shrink-0 text-slate-400 transition-transform ${
                                isSubjectOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isSubjectOpen && (
                            <ul
                              role="listbox"
                              className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                            >
                              {availableSubjects.map((sub) => {
                                const isActive = sub === subject;
                                return (
                                  <li key={sub} role="option" aria-selected={isActive}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubject(sub);
                                        setIsSubjectOpen(false);
                                      }}
                                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                        isActive
                                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      <span className="truncate">{sub}</span>
                                      {isActive && (
                                        <Check size={14} className="shrink-0" />
                                      )}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pl-9 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                          No subjects listed for this teacher
                        </div>
                      )}
                      <BookOpen
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setTopic(e.target.value)
                      }
                      placeholder="e.g., Integration by parts, Organic Chemistry"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setNotes(e.target.value)
                      }
                      placeholder="Add requests or details for the session..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Booking Summary
                  </span>
                  {selectedSlots.length > 0 && subject ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Subject
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {subject}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Lessons
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedSlots.length}
                        </span>
                      </div>
                      <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
                        {sortedSelectedSlots.map((slot) => (
                          <li
                            key={slot.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2 py-1 dark:bg-slate-900/60"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {new Date(slot.startTime).toLocaleDateString(
                                "en-GB",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                              ,{" "}
                              {new Date(slot.startTime).toLocaleTimeString(
                                "en-GB",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                              {" - "}
                              {new Date(slot.endTime).toLocaleTimeString(
                                "en-GB",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSlot(slot)}
                              aria-label="Remove lesson"
                              className="shrink-0 cursor-pointer text-slate-400 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Estimated cost
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          £{estimatedCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Pick a date, time, and subject to see your booking
                      summary.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!bookingSuccess && (
          <div className="border-t border-slate-100 p-5 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-400">{getConfirmHint()}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  selectedSlots.length === 0 ||
                  isSubmitting ||
                  availableSubjects.length === 0
                }
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isSubmitting
                  ? "Booking..."
                  : selectedSlots.length > 1
                    ? `Confirm ${selectedSlots.length} Bookings`
                    : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLessonModal;
