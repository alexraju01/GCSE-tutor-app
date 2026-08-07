import { z } from "zod";

export const emailSchema = z
  .string()
  .email({ message: "Invalid email address" })
  .trim()
  .toLowerCase();
