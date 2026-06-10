import { Role, Level, Subject } from "@generated/enums.js";
import { z } from "zod";

// ==========================================
// 1. Shared Base Fields
// ==========================================
const baseAuthFields = {
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .trim()
    .toLowerCase()
    .min(5, { message: "Email is too short" })
    .max(150, { message: "Email cannot exceed 150 characters" }),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name cannot exceed 100 characters" }),
};

const credentialsFields = {
  provider: z.literal("credentials").default("credentials"),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z.string({ message: "Confirm password is required" }),
};

const socialFields = {
  provider: z.enum(["google", "github"]),
};

// ==========================================
// 2. Profile / Teacher Specific Fields
// ==========================================
const teacherFieldsSchema = z.object({
  bio: z
    .string({ message: "Teacher profile bio is required" })
    .min(10, "Bio must be at least 10 characters"),
  qualifications: z
    .string({ message: "Qualifications are required" })
    .min(1, "Qualifications are required"),
  hourlyRate: z
    .number({
      message: "Hourly rate must be a number",
    })
    .positive(),
  subjects: z
    .array(z.enum(Subject), { message: "Subjects are required" })
    .min(1, "Select at least one subject"),
  levels: z
    .array(z.enum(Level), { message: "Levels are required" })
    .min(1, "Select at least one level"),
});

// ==========================================
// 3. Structural Conditional Schema
// ==========================================

// Base Credentials Account Type
const credentialsBase = z.object({ ...baseAuthFields, ...credentialsFields });
const socialBase = z.object({ ...baseAuthFields, ...socialFields });

// Discriminated union by ROLE to handle conditional requirements cleanly
const teacherCredentialsSchema = credentialsBase
  .extend({ role: z.literal(Role.TEACHER) })
  .merge(teacherFieldsSchema);
const studentCredentialsSchema = credentialsBase.extend({
  role: z.literal(Role.STUDENT).default(Role.STUDENT),
});

const teacherSocialSchema = socialBase
  .extend({ role: z.literal(Role.TEACHER) })
  .merge(teacherFieldsSchema);
const studentSocialSchema = socialBase.extend({
  role: z.literal(Role.STUDENT).default(Role.STUDENT),
});

// ==========================================
// 4. Final Combined Registration Schema
// ==========================================
export const registrationSchema = z.preprocess(
  (data) => {
    // Defaulting provider to credentials if omitted safely
    if (data && typeof data === "object" && !("provider" in data)) {
      return { ...data, provider: "credentials" };
    }
    return data;
  },
  z.discriminatedUnion("provider", [
    // Branch A: Credentials Sign Up
    z
      .discriminatedUnion("role", [teacherCredentialsSchema, studentCredentialsSchema])
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      }),

    // Branch B: Social Sign Up
    z.discriminatedUnion("role", [teacherSocialSchema, studentSocialSchema]),
  ]),
);

export const userSchema = registrationSchema;
export type UserInput = z.infer<typeof userSchema>;
