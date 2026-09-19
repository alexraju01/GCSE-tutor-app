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
export type updateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type DeleteAvailabilityInput = z.infer<typeof deleteAvailabilitySchema>;
