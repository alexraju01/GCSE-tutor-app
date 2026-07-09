import "dotenv/config";
import { globalErrorHandler } from "@controllers/error.controller.js";
import {
  teacherRouter,
  userRouter,
  availabilityRouter,
  studentRouter,
  socialRouter,
  dashboardRouter,
  bookingRouter,
} from "@routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { BLUE, RESET } from "./utils/colours.js";

const app = express();
const { PORT } = process.env || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use(morgan("dev"));

// Resource Routing
app.use("/api/v1/users", userRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/auth", socialRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/bookings", bookingRouter);

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.info(`${BLUE}Server listening on http://localhost:${PORT} ${RESET}`);
});
