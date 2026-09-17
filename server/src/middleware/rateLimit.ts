import { rateLimit } from "express-rate-limit";

// Broad safety net for every route — generous enough to never bother real traffic.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many requests. Please try again later." },
});

// Tight limit for credential-guessing surfaces (login, signup, social-sync).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    status: "fail",
    message: "Too many attempts from this device. Please try again in 15 minutes.",
  },
});
