import { z } from "zod";

export const emailSchema = z
  .string()
  .max(254, { message: "Email cannot exceed 254 characters" })
  .email({ message: "Invalid email address" })
  .trim()
  .toLowerCase();
