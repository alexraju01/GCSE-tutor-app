import { z } from "zod";
import { emailSchema } from "./common.schema.js";

export const studentFieldsShape = {};

export const updateStudentFieldsSchema = z
  .object({
    name: z
      .string({ message: "Name must be a string" })
      .min(1, { message: "Name must be at least 1 character long" })
      .max(100, { message: "Name cannot exceed 100 characters" })
      .optional(),
    email: emailSchema.optional(),
    image: z.url().optional(),
  })
  .strict() // explicit allowlist — role, password, id etc. can never sneak in
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided to update.",
  });
export type UpdateStudentInput = z.infer<typeof updateStudentFieldsSchema>;
