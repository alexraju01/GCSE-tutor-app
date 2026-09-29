import { useEffect, useMemo, useRef, useState } from "react";
import type { SessionData } from "@/types/auth";
import type { BookingPolicy, Teacher } from "@/types/teacher";
import { isAllowedLessonDuration } from "@constants/index";
import { api, type BookingConflict, type TeacherAvailabilitySlot } from "@utils/api";
import { ApiError } from "@utils/fetchData";
import {
  addDaysToKey,
  getUkDateParts,
  toUkDateKey,
  ukMinutesOfDay,
} from "@utils/ukTime";

export type RawAvailability = TeacherAvailabilitySlot;

// same cap as createLessonSchema on the server
export const MAX_BATCH_SIZE = 20;
// server max is 120 days per request (tutor's maxAdvanceDays trims it further)
const FETCH_WINDOW_DAYS = 120;
const DAY_MS = 86_400_000;
const NEXT_AVAILABLE_COUNT = 4;

export interface LessonDetails {
  subject: string;
  topic: string;
  notes: string;
}

interface UseBookLessonModalParams {
  isOpen: boolean;
  teacher: Teacher;
  session: SessionData | null;
}

// A teacher can teach the same subject at multiple levels (e.g. Maths at
// both GCSE and A-Level) — dedupe so the subject picker doesn't list it twice.
const getUniqueSubjects = (teacher: Teacher): string[] =>
  Array.from(new Set(teacher.teaches?.map((t) => t.subject) ?? []));

const slotMinutes = (slot: RawAvailability) =>
  Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60_000);

// server already enforces this, just never show a non-standard slot
const bookableSlots = (slots: RawAvailability[]) =>
  slots.filter((slot) => isAllowedLessonDuration(slotMinutes(slot))).sort(byStart);

const byStart = (a: RawAvailability, b: RawAvailability) =>
  new Date(a.startTime).getTime() - new Date(b.startTime).getTime();

const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Owns every piece of state, fetching, and derived data for the booking
// modal, so the component tree underneath is pure presentation.
export const useBookLessonModal = ({ isOpen, teacher, session }: UseBookLessonModalParams) => {
  const teacherId = teacher.id;
  const hourlyRate = teacher.hourlyRate;
  const availableSubjects = useMemo(() => getUniqueSubjects(teacher), [teacher]);
  const defaultSubject = availableSubjects[0] ?? "";

  const [slots, setSlots] = useState<RawAvailability[]>([]);
  const [policy, setPolicy] = useState<BookingPolicy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookedLessons, setBookedLessons] = useState<Lesson[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<RawAvailability[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // subject/topic/notes per selected lesson, the form edits the active one
  const [details, setDetails] = useState<Record<string, LessonDetails>>({});
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  // details new picks start with (copied from the last one)
  const [template, setTemplate] = useState<LessonDetails>({ subject: defaultSubject, topic: "", notes: "" });

  // same key while the booking is unchanged so retries can't double-book
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);

  const token = session?.backendToken;

  const selectSlotView = (slot: RawAvailability) => {
    const start = new Date(slot.startTime);
    setSelectedDateKey(toUkDateKey(start));
    const { year, month } = getUkDateParts(start);
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  useEffect(() => {
    if (!isOpen || !teacherId) return;

    // Avoids a superseded request overwriting state from a newer one.
    let ignore = false;

    const fetchSlots = async () => {
      setIsLoading(true);
      setLoadError(false);
      setErrorMessage(null);
      setNoticeMessage(null);
      // Reset ephemeral state so it doesn't leak into the next open.
      setSelectedSlots([]);
      setDetails({});
      setActiveSlotId(null);
      setTemplate({ subject: defaultSubject, topic: "", notes: "" });
      setBookedLessons(null);
      try {
        const now = new Date();
        const response = await api.teacher.getBookableAvailabilities(teacherId, {
          from: now,
          to: new Date(now.getTime() + FETCH_WINDOW_DAYS * DAY_MS),
        });

        if (ignore) return;

        const loadedSlots = bookableSlots(response.data ?? []);
        setSlots(loadedSlots);
        setPolicy(response.policy ?? null);

        if (loadedSlots.length > 0) selectSlotView(loadedSlots[0]);
      } catch (err) {
        if (ignore) return;
        console.error("Failed to load availability slots:", err);
        setSlots([]);
        setLoadError(true);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void fetchSlots();

    return () => {
      ignore = true;
    };
  }, [isOpen, teacherId, defaultSubject, reloadKey]);

  // refetch after a conflict, drops slots that are gone but keeps the rest selected
  const refreshSlots = async () => {
    try {
      const now = new Date();
      const response = await api.teacher.getBookableAvailabilities(teacherId, {
        from: now,
        to: new Date(now.getTime() + FETCH_WINDOW_DAYS * DAY_MS),
      });
      const fresh = bookableSlots(response.data ?? []);
      const freshIds = new Set(fresh.map((s) => s.id));
      setSlots(fresh);
      setSelectedSlots((prev) => prev.filter((s) => freshIds.has(s.id)));
    } catch {
      // keep what we have, the error message already covers it
    }
  };

  const groupedSlots = useMemo(() => {
    const groups: Record<string, RawAvailability[]> = {};
    for (const slot of slots) {
      const dateKey = toUkDateKey(new Date(slot.startTime));
      (groups[dateKey] ??= []).push(slot);
    }
    return groups;
  }, [slots]);

  const todayKey = toUkDateKey(new Date());

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    let startDayIndex = new Date(year, month, 1).getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArr: (Date | null)[] = [];

    for (let i = 0; i < startDayIndex; i++) daysArr.push(null);
    for (let day = 1; day <= totalDays; day++) daysArr.push(new Date(year, month, day));

    // Always pad to a fixed 6 rows (42 cells) so the grid is the same
    // height every month and nothing below it shifts.
    while (daysArr.length < 42) daysArr.push(null);

    return daysArr;
  }, [currentMonth]);

  // Bound month navigation to where real availability actually is.
  const monthBounds = useMemo(() => {
    if (slots.length === 0) return null;
    const earliest = getUkDateParts(new Date(slots[0].startTime));
    const latest = getUkDateParts(new Date(slots[slots.length - 1].startTime));
    return {
      min: new Date(earliest.year, earliest.month - 1, 1),
      max: new Date(latest.year, latest.month - 1, 1),
    };
  }, [slots]);

  const canGoPrevMonth = monthBounds ? currentMonth > monthBounds.min : false;
  const canGoNextMonth = monthBounds ? currentMonth < monthBounds.max : false;

  const nextAvailable = useMemo(() => slots.slice(0, NEXT_AVAILABLE_COUNT), [slots]);

  const sortedSelectedSlots = useMemo(() => [...selectedSlots].sort(byStart), [selectedSlots]);
  const selectedIds = useMemo(() => new Set(selectedSlots.map((s) => s.id)), [selectedSlots]);

  const selectedCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const slot of selectedSlots) {
      const key = toUkDateKey(new Date(slot.startTime));
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [selectedSlots]);

  const totalMinutes = selectedSlots.reduce((sum, slot) => sum + slotMinutes(slot), 0);
  const estimatedCost = (hourlyRate * totalMinutes) / 60;

  const getDetails = (slotId: string): LessonDetails => details[slotId] ?? template;
  const activeDetails = activeSlotId ? getDetails(activeSlotId) : template;

  const clearMessages = () => {
    setErrorMessage(null);
    setNoticeMessage(null);
  };

  const addSlots = (toAdd: RawAvailability[], withDetails: LessonDetails) => {
    setDetails((prev) => {
      const next = { ...prev };
      for (const slot of toAdd) next[slot.id] = { ...withDetails };
      return next;
    });
    setSelectedSlots((prev) => [...prev, ...toAdd]);
  };

  const toggleSlot = (slot: RawAvailability) => {
    clearMessages();

    if (selectedIds.has(slot.id)) {
      setSelectedSlots((prev) => prev.filter((s) => s.id !== slot.id));
      if (activeSlotId === slot.id) setActiveSlotId(null);
      return;
    }
    if (selectedSlots.length >= MAX_BATCH_SIZE) {
      setErrorMessage(`You can book at most ${MAX_BATCH_SIZE} lessons at once.`);
      return;
    }

    addSlots([slot], template);
    setActiveSlotId(slot.id);
  };

  // "next available" chip - jump to the slot and select it
  const pickSlot = (slot: RawAvailability) => {
    selectSlotView(slot);
    if (!selectedIds.has(slot.id)) toggleSlot(slot);
    else setActiveSlotId(slot.id);
  };

  // select the same day/time/length in the next few weeks where it's free
  const repeatWeekly = (slot: RawAvailability, weeks: number) => {
    clearMessages();
    const start = new Date(slot.startTime);
    const dateKey = toUkDateKey(start);
    const minuteOfDay = ukMinutesOfDay(start);
    const length = slotMinutes(slot);

    const found: RawAvailability[] = [];
    let missing = 0;
    for (let week = 1; week <= weeks; week++) {
      const targetKey = addDaysToKey(dateKey, week * 7);
      const match = (groupedSlots[targetKey] ?? []).find(
        (s) => ukMinutesOfDay(new Date(s.startTime)) === minuteOfDay && slotMinutes(s) === length,
      );
      if (!match) missing++;
      else if (!selectedIds.has(match.id)) found.push(match);
    }

    const room = MAX_BATCH_SIZE - selectedSlots.length;
    const toAdd = found.slice(0, room);
    addSlots(toAdd, getDetails(slot.id));

    const parts = [`Added ${toAdd.length} more ${toAdd.length === 1 ? "week" : "weeks"}.`];
    if (missing > 0) parts.push(`${missing} ${missing === 1 ? "week isn't" : "weeks aren't"} available at that time.`);
    if (found.length > toAdd.length) parts.push(`Stopped at the ${MAX_BATCH_SIZE}-lesson limit.`);
    setNoticeMessage(parts.join(" "));
  };

  const updateActiveDetails = (patch: Partial<LessonDetails>) => {
    setTemplate((prev) => ({ ...prev, ...patch }));
    if (activeSlotId) {
      setDetails((prev) => ({ ...prev, [activeSlotId]: { ...getDetails(activeSlotId), ...patch } }));
    }
  };

  const setSlotSubject = (slotId: string, subject: string) => {
    setDetails((prev) => ({ ...prev, [slotId]: { ...getDetails(slotId), subject } }));
  };

  // copy the active lesson's details to all selected lessons
  const applyDetailsToAll = () => {
    const source = activeDetails;
    setDetails((prev) => {
      const next = { ...prev };
      for (const slot of selectedSlots) next[slot.id] = { ...source };
      return next;
    });
    setNoticeMessage(`Applied to all ${selectedSlots.length} lessons.`);
  };

  const getConfirmHint = (): string | null => {
    if (selectedSlots.length === 0) return "Select one or more time slots to continue.";
    return `${selectedSlots.length} ${selectedSlots.length === 1 ? "lesson" : "lessons"} selected.`;
  };

  const requiresApproval = policy?.requireApproval ?? teacher.requireApproval ?? false;

  const getConfirmButtonLabel = (): string => {
    if (isSubmitting) return requiresApproval ? "Sending..." : "Booking...";
    const noun = selectedSlots.length > 1 ? `${selectedSlots.length} ` : "";
    if (requiresApproval) return `Request ${noun}${selectedSlots.length > 1 ? "Lessons" : "Lesson"}`;
    return `Confirm ${noun}${selectedSlots.length > 1 ? "Bookings" : "Booking"}`;
  };

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // drop just the slots that failed and keep the rest selected
  const recoverFromConflicts = (conflicts: BookingConflict[], fallbackMessage: string) => {
    const conflictIds = new Set(conflicts.map((c) => c.availabilityId));
    const lost = selectedSlots.filter((s) => conflictIds.has(s.id));
    const remaining = selectedSlots.length - lost.length;

    setSelectedSlots((prev) => prev.filter((s) => !conflictIds.has(s.id)));

    const unbookable = new Set(
      conflicts.filter((c) => c.reason !== "subject" && c.reason !== "student_overlap").map((c) => c.availabilityId),
    );
    setSlots((prev) => prev.filter((s) => !unbookable.has(s.id)));

    const summary =
      lost.length === 1 ? conflicts[0].message : `${lost.length} of your lessons couldn't be booked: ${conflicts[0].message}`;
    setErrorMessage(
      remaining > 0
        ? `${summary} We've removed ${lost.length === 1 ? "it" : "them"} — ${remaining} ${remaining === 1 ? "lesson is" : "lessons are"} still selected.`
        : summary || fallbackMessage,
    );
    void refreshSlots();
  };

  // Returns whether the booking succeeded.
  const handleConfirmBooking = async (): Promise<boolean> => {
    if (selectedSlots.length === 0) return false;

    if (!token) {
      setErrorMessage("You must be logged in to book a lesson.");
      return false;
    }

    const payload = sortedSelectedSlots.map((slot) => {
      const d = getDetails(slot.id);
      return {
        teacherProfileId: teacherId,
        availabilityId: slot.id,
        subject: d.subject || defaultSubject,
        topic: d.topic.trim() || undefined,
        notes: d.notes.trim() || undefined,
      };
    });

    if (payload.some((item) => !item.subject)) {
      setErrorMessage("Please choose a subject for every lesson.");
      return false;
    }

    const signature = JSON.stringify(payload);
    if (idempotencyRef.current?.signature !== signature) {
      idempotencyRef.current = { signature, key: newIdempotencyKey() };
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await api.lesson.create(payload, token, idempotencyRef.current.key);
      const lessons = response.data ?? [];
      const bookedIds = new Set(selectedSlots.map((s) => s.id));
      setSlots((prev) => prev.filter((s) => !bookedIds.has(s.id)));
      setBookedLessons(lessons);
      idempotencyRef.current = null;
      return true;
    } catch (err: unknown) {
      const conflicts = err instanceof ApiError ? (err.details?.conflicts as BookingConflict[] | undefined) : undefined;
      if (conflicts && conflicts.length > 0) {
        recoverFromConflicts(conflicts, err instanceof Error ? err.message : "");
      } else if (err instanceof ApiError && err.status === 409) {
        // db caught a race, don't know which slot - just refresh
        setErrorMessage(err.message);
        void refreshSlots();
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong while booking.");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAfterSuccess = () => {
    setBookedLessons(null);
    setSelectedSlots([]);
    setDetails({});
    setActiveSlotId(null);
  };

  const retry = () => setReloadKey((key) => key + 1);

  return {
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
    selectedDateKey,
    setSelectedDateKey,
    currentMonth,
    activeSlotId,
    setActiveSlotId,
    activeDetails,
    updateActiveDetails,
    applyDetailsToAll,
    getDetails,
    setSlotSubject,
    groupedSlots,
    todayKey,
    calendarDays,
    canGoPrevMonth,
    canGoNextMonth,
    nextAvailable,
    pickSlot,
    repeatWeekly,
    sortedSelectedSlots,
    selectedIds,
    selectedCountByDate,
    totalMinutes,
    estimatedCost,
    toggleSlot,
    getConfirmHint,
    getConfirmButtonLabel,
    handlePrevMonth,
    handleNextMonth,
    handleConfirmBooking,
    resetAfterSuccess,
    retry,
  };
};
