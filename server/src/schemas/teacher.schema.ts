import { Level, Subject } from "@generated/enums.js";
import { z } from "zod";

// Core teacher fields primitive shape
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
    .int({ message: "Needs to be an integer" })
    .positive({ message: "Hourly rate must be a positive number" }),
  subjects: z
    .array(z.enum(Subject), { error: "Subjects are required" })
    .min(1, { message: "Select at least one subject" }),
  levels: z
    .array(z.enum(Level), { error: "Levels are required" })
    .min(1, { message: "Select at least one level" }),
};

// 1. Used for teacher-specific profile PATCH routes
export const updateTeacherFieldsSchema = z.object(teacherFieldsShape).partial().strict();
export type UpdateTeacherInput = z.infer<typeof updateTeacherFieldsSchema>;
