import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { BLUE, RESET } from "./utils/colours.js";

const app = express();
const { PORT } = process.env || 5000;
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.info(`${BLUE}Server listening on http://localhost:${PORT} ${RESET}`);
});
