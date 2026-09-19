import { z } from "zod";
import { emailSchema } from "./common.schema.js";
export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    image: z.url({ message: "Image must be a valid URL" }).optional(),
  })
  .strict() // explicit allowlist — role, password, id etc. can never sneak in
  .refine((data) => Object.keys(data).length > 0, {
    error: "At least one field must be provided to update.",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
