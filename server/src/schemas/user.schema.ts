import { z } from "zod";
import { emailSchema } from "./common.schema.js";
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  image: z.url({ message: "Image must be a valid URL" }).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
