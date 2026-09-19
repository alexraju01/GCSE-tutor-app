import { useEffect, useMemo, useState } from "react";
import type { SessionData } from "@/types/auth";
import type { Teacher } from "@/types/teacher";
import { api, type TeacherAvailabilitySlot } from "@utils/api";
import { toUkDateKey, getUkDateParts } from "@utils/ukTime";

export type RawAvailability = TeacherAvailabilitySlot;

export const MAX_BATCH_SIZE = 20;

interface UseBookLessonModalParams {
  isOpen: boolean;
  teacher: Teacher;
  session: SessionData | null;
}

// A teacher can teach the same subject at multiple levels (e.g. Maths at
// both GCSE and A-Level) — dedupe so the subject picker doesn't list it twice.
const getUniqueSubjects = (teacher: Teacher): string[] =>
  Array.from(new Set(teacher.teaches?.map((t) => t.subject) ?? []));

// Owns every piece of state, fetching, and derived data for the booking
// modal, so the component tree underneath is pure presentation.
export const useBookLessonModal = ({
  isOpen,
  teacher,
  session,
}: UseBookLessonModalParams) => {
  const teacherId = teacher.id;
  const hourlyRate = teacher.hourlyRate;

  const [slots, setSlots] = useState<RawAvailability[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(() =>
    getUniqueSubjects(teacher),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<RawAvailability[]>([]);
  const [bookedCount, setBookedCount] = useState<number>(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const token = session?.backendToken;

  useEffect(() => {
    if (!isOpen || !teacherId) return;

    // Avoids a superseded request overwriting state from a newer one.
    let ignore = false;

    const fetchSlots = async () => {
      setIsLoading(true);
      setLoadError(false);
      setErrorMessage(null);
      // Reset ephemeral state so it doesn't leak into the next open.
      setSelectedSlots([]);
      setTopic("");
      setNotes("");
      setBookingSuccess(false);
      setBookedCount(0);
      try {
        // limit=100 (the server's max) so a teacher with lots of open slots
        // doesn't silently get cut off after the default page size of 10.
        const slotsResult = await api.teacher.getAvailabilities(
          teacherId,
          { limit: 100 },
          token,
        );

        if (ignore) return;

        const loadedSlots: RawAvailability[] = slotsResult.data || [];
        setSlots(loadedSlots);

        const fetchedSubjects = getUniqueSubjects(teacher);
        setAvailableSubjects(fetchedSubjects);
        if (fetchedSubjects.length > 0) {
          setSubject(fetchedSubjects[0]);
        }

        if (loadedSlots.length > 0) {
          const firstSlotDate = new Date(loadedSlots[0].startTime);
          setSelectedDateKey(toUkDateKey(firstSlotDate));
          const { year, month } = getUkDateParts(firstSlotDate);
          setCurrentMonth(new Date(year, month - 1, 1));
        }
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
  }, [isOpen, teacherId, token, teacher, reloadKey]);

  const groupedSlots = useMemo(() => {
    const groups: Record<string, RawAvailability[]> = {};

    slots.forEach((slot) => {
      const dateKey = toUkDateKey(new Date(slot.startTime));
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

  const todayKey = toUkDateKey(new Date());

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
    const earliestParts = getUkDateParts(new Date(Math.min(...times)));
    const latestParts = getUkDateParts(new Date(Math.max(...times)));

    return {
      min: new Date(earliestParts.year, earliestParts.month - 1, 1),
      max: new Date(latestParts.year, latestParts.month - 1, 1),
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
      const key = toUkDateKey(new Date(slot.startTime));
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [selectedSlots]);

  const totalMinutes = Math.round(
    selectedSlots.reduce(
      (sum, slot) =>
        sum +
        (new Date(slot.endTime).getTime() -
          new Date(slot.startTime).getTime()) /
          60000,
      0,
    ),
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

  const getConfirmButtonLabel = (): string => {
    if (isSubmitting) return "Booking...";
    if (selectedSlots.length > 1)
      return `Confirm ${selectedSlots.length} Bookings`;
    return "Confirm Booking";
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

  // Returns whether the booking succeeded, so the caller can decide what
  // happens next (e.g. closing the modal) without this hook knowing about it.
  const handleConfirmBooking = async (): Promise<boolean> => {
    if (selectedSlots.length === 0) return false;

    if (!token) {
      setErrorMessage("You must be logged in to book a lesson.");
      return false;
    }

    if (!subject) {
      setErrorMessage("Please select a subject for the lesson.");
      return false;
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
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Booking error:", error);
      setErrorMessage(error.message || "Something went wrong while booking.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAfterSuccess = () => {
    setBookingSuccess(false);
    setSelectedSlots([]);
    setTopic("");
    setNotes("");
  };

  const retry = () => setReloadKey((key) => key + 1);

  return {
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
  };
};
