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
    .min(20, { message: "Bio must be at least 20 characters" }),
  qualifications: z.string({
    error: (issue) =>
      issue.input === undefined ? "Qualification is required" : "Qualifications must be a string",
  }),
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

// 1. Used for teacher-specific profile PATCH routes
export const updateTeacherFieldsSchema = z.object(teacherFieldsShape).partial().strict();

export type UpdateTeacherInput = z.infer<typeof updateTeacherFieldsSchema>;
