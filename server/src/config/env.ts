import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("90d"),
  JWT_COOKIE_EXPIRES_IN: z.coerce.number().int().positive().default(90),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default("*"),
  // Shared secret that only our own Next.js server should know — gates server-to-server
  // routes (e.g. social-auth sync) that must never be callable directly by a browser.
  INTERNAL_API_SECRET: z.string().min(32, "INTERNAL_API_SECRET must be at least 32 characters"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
