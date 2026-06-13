import { z } from "zod";

export const createAvailabilitySchema = z
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

export type createAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
