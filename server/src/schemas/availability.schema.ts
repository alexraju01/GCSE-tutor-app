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

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type createAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type updateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
