import { ApiError } from "@utils/fetchData";

// server actions can't throw custom errors to the client, so return this instead
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: Record<string, unknown> };

export const actionError = (error: unknown, fallback: string): ActionResult<never> => ({
  ok: false,
  error: error instanceof Error ? error.message : fallback,
  details: error instanceof ApiError ? error.details : undefined,
});
