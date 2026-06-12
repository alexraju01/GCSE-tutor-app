import "dotenv/config";
import { globalErrorHandler } from "@controllers/error.controller.js";
import { teacherRouter, userRouter, availabilityRouter } from "@routes";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import { BLUE, RESET } from "./utils/colours.js";

const app = express();
const { PORT } = process.env || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Resource Routing
app.use("/api/v1/users", userRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/availability", availabilityRouter);

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.info(`${BLUE}Server listening on http://localhost:${PORT} ${RESET}`);
});
