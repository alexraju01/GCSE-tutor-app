import { globalErrorHandler } from "@controllers/error.controller.js";
import { apiLimiter } from "@middleware";
import {
  teacherRouter,
  userRouter,
  availabilityRouter,
  studentRouter,
  socialRouter,
  dashboardRouter,
  lessonRouter,
} from "@routes";
import { AppError } from "@utils/AppError.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { BLUE, RESET } from "./utils/colours.js";

const app = express();

// we sit behind a proxy/load balancer in prod, need this so req.ip is the
// actual client and not just the proxy
app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  }),
);
app.use(apiLimiter);

if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Resource Routing
app.use("/api/v1/users", userRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/auth", socialRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/lessons", lessonRouter);

// Unmatched routes
app.all("/*splat", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHandler);

const server = app.listen(env.PORT, () => {
  console.info(`${BLUE}Server listening on http://localhost:${env.PORT}${RESET}`);
});

// Graceful shutdown & crash visibility — important for orchestrated environments (k8s, ECS, etc.)
process.on("unhandledRejection", (err: Error) => {
  console.error("UNHANDLED REJECTION! Shutting down...", err);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.info("SIGTERM received. Shutting down gracefully.");
  server.close(() => console.info("Process terminated."));
});
