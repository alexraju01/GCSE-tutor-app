import { z } from "zod";

export const availabilitySlotSchema = z
  .object({
    startTime: z.iso.datetime({
      error: (issue) =>
        issue.input === undefined
          ? "Please select a start date and time for your availability."
          : "The date format is invalid. Please select a valid date and time.",
    }),

    durationInMinutes: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "Please specify how long this availability slot should last."
            : "Invalid durationInMinutes. Please select a valid length for your session.",
      })
      .refine((val) => [60, 90, 120].includes(val), {
        error:
          "Please choose a standard duration: 1 hour (60m), 1.5 hours (90m), or 2 hours (120m).",
      }),
  })
  .strict();

// Accepts either a single slot or a batch (e.g. setting up a whole week of
// availability in one go). The response mirrors whichever shape was sent.
export const createAvailabilitySchema = z.union([
  availabilitySlotSchema,
  z
    .array(availabilitySlotSchema)
    .min(1, { message: "Provide at least one availability slot." })
    .max(50, { message: "You can create at most 50 slots in a single request." }),
]);

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Dates must be in YYYY-MM-DD format.",
});
const wallClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Times must be in HH:mm format.",
});

// A weekly pattern the server expands into individual slots itself, so a whole
// term of availability is one request and one transaction. All dates/times are
// UK wall-clock; days are 0 = Monday … 6 = Sunday.
export const recurringAvailabilitySchema = z
  .object({
    days: z
      .array(z.number().int().min(0).max(6))
      .min(1, { message: "Pick at least one day." })
      .max(7)
      .refine((days) => new Set(days).size === days.length, {
        error: "Each day can only be picked once.",
      }),
    startDate: dateKey,
    from: wallClockTime,
    to: wallClockTime,
    lessonLength: z.number().refine((val) => [60, 90, 120].includes(val), {
      error: "Please choose a standard duration: 1 hour (60m), 1.5 hours (90m), or 2 hours (120m).",
    }),
    weeks: z.number().int().min(1).max(12, { message: "You can repeat for at most 12 weeks." }),
    // "YYYY-MM-DD|HH:mm" keys of generated slots the teacher removed from the preview.
    exclude: z.array(z.string().max(16)).max(500).optional(),
  })
  .strict()
  .refine(({ from, to }) => to > from, {
    error: "End time must be after start time.",
    path: ["to"],
  });

export const updateAvailabilitySchema = availabilitySlotSchema.partial().strict();

// Batch-remove a teacher's own slots — mirrors createAvailabilitySchema's
// batch shape and cap.
export const deleteAvailabilitySchema = z.object({
  ids: z
    .array(z.uuid({ message: "Invalid availability id format" }))
    .min(1, { message: "Provide at least one availability id to delete." })
    .max(50, { message: "You can delete at most 50 slots in a single request." })
    .refine((ids) => new Set(ids).size === ids.length, {
      error: "Cannot delete the same availability slot twice in one request.",
    }),
});

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type createAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type RecurringAvailabilityInput = z.infer<typeof recurringAvailabilitySchema>;
export type updateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type DeleteAvailabilityInput = z.infer<typeof deleteAvailabilitySchema>;
