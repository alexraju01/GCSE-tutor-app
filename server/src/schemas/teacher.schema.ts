import { Level, Subject } from "@generated/enums.js";
import { z } from "zod";

// Core teacher fields primitive shape

export const teachesItemSchema = z.object({
  id: z.string().uuid({ message: "Invalid teaches item ID format" }).optional(),
  subject: z.enum(Subject, {
    message: `Invalid subject selection. Available options: ${Object.values(Subject).join(", ")}`,
  }),
  level: z.enum(Level, {
    message: `Invalid level selection. Available options: ${Object.values(Level).join(", ")}`,
  }),
});

export const teacherFieldsShape = {
  bio: z
    .string({ error: "Bio is required" })
    .min(20, { message: "Bio must be at least 20 characters" })
    .max(2000, { message: "Bio cannot exceed 2000 characters" }),
  qualifications: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Qualification is required" : "Qualifications must be a string",
    })
    .max(500, { message: "Qualifications cannot exceed 500 characters" }),
  hourlyRate: z
    .number({
      error: (issue) =>
        issue.input === undefined ? "Hourly rate is required" : "Hourly rate must be a number",
    })
    .positive({ message: "Hourly rate must be a positive number" }),
  teaches: z
    .array(teachesItemSchema, {
      message: "Teaching subjects and levels is required as an object under 'teaches' field",
    })
    .min(1, { message: "Select at least one subject and level pair" }),
};

// booking rules - only editable from the profile, db defaults apply on signup
export const teacherPolicyShape = {
  requireApproval: z.boolean({ message: "requireApproval must be true or false" }),
  minNoticeHours: z
    .number()
    .int()
    .min(0, { message: "Minimum notice can't be negative" })
    .max(168, { message: "Minimum notice can be at most 1 week (168 hours)" }),
  maxAdvanceDays: z
    .number()
    .int()
    .min(1, { message: "Students must be able to book at least 1 day ahead" })
    .max(365, { message: "Advance booking can be at most 365 days" }),
  cancellationCutoffHours: z
    .number()
    .int()
    .min(0, { message: "Cancellation cutoff can't be negative" })
    .max(168, { message: "Cancellation cutoff can be at most 1 week (168 hours)" }),
};

// 1. Used for teacher-specific profile PATCH routes
export const updateTeacherFieldsSchema = z
  .object({ ...teacherFieldsShape, ...teacherPolicyShape })
  .partial()
  .strict();

export type UpdateTeacherInput = z.infer<typeof updateTeacherFieldsSchema>;
