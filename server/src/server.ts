import "dotenv/config";
import { userRouter } from "@routes";
import express from "express";
import morgan from "morgan";
import { globalErrorHandler } from "./controllers/error.controller.js";
import { BLUE, RESET } from "./utils/colours.js";

const app = express();
const { PORT } = process.env || 5000;

app.use(express.json());
app.use(morgan("dev"));

// Resource Routing
app.use("/api/v1/users", userRouter);

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.info(`${BLUE}Server listening on http://localhost:${PORT} ${RESET}`);
});
