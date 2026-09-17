import { rateLimit } from "express-rate-limit";

// loose global limit, just here to catch abuse - shouldn't ever bother real users
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many requests. Please try again later." },
});

// tighter limit on login/signup/social-sync so brute forcing passwords is slow
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
