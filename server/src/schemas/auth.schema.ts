import { Role } from "@generated/enums.js";
import { z } from "zod";
import { studentFieldsShape } from "./student.schema.js";
import { teacherFieldsShape } from "./teacher.schema.js";

// ==========================================
// 1. Core Auth Field Shapes
// ==========================================
const emailSchema = z.email({ error: "Invalid email address" }).trim().toLowerCase();

const baseAuthFields = {
  email: emailSchema,
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name cannot exceed 100 characters" }),
};

const credentialsFields = {
  provider: z.literal("credentials"),
  password: z
    .string({ error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z.string({ error: "Confirm password is required" }),
};

const socialFields = {
  provider: z.enum(["google", "github"]),
};

// ==========================================
// 2. Concrete Registration Schemas
// ==========================================
const teacherCredentialsSchema = z.object({
  ...baseAuthFields,
  ...credentialsFields,
  ...teacherFieldsShape,
  role: z.literal(Role.TEACHER),
});

const studentCredentialsSchema = z.object({
  ...baseAuthFields,
  ...credentialsFields,
  ...studentFieldsShape,
  role: z.literal(Role.STUDENT),
});

const teacherSocialSchema = z.object({
  ...baseAuthFields,
  ...socialFields,
  ...teacherFieldsShape,
  role: z.literal(Role.TEACHER),
});

const studentSocialSchema = z.object({
  ...baseAuthFields,
  ...socialFields,
  ...studentFieldsShape,
  role: z.literal(Role.STUDENT),
});

// ==========================================
// 3. Discriminated Unions
// ==========================================
const credentialsUnion = z
  .discriminatedUnion("role", [teacherCredentialsSchema, studentCredentialsSchema])
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

const socialUnion = z.discriminatedUnion("role", [teacherSocialSchema, studentSocialSchema]);
const baseDiscriminatedUnion = z.discriminatedUnion("provider", [credentialsUnion, socialUnion]);

// ==========================================
// 4. Ingestion Pipeline Export
// ==========================================
export const registrationSchema = z
  .unknown()
  .transform((val) => {
    if (val && typeof val === "object") {
      return {
        provider: "credentials",
        role: Role.STUDENT,
        ...val,
      };
    }
    return val;
  })
  .pipe(baseDiscriminatedUnion);

export type UserInput = z.infer<typeof registrationSchema>;
