import { AuthError } from "next-auth";

// NextAuth wraps whatever authorize() throws, preserving the original error
// at `.cause.err` — this recovers it instead of AuthError's own generic
// message ("Read more at https://errors.authjs.dev#...").
export const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AuthError && error.cause?.err instanceof Error) {
    return error.cause.err.message;
  }
  return fallback;
};
