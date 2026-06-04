import { getAllUsers } from "@controllers/user.controller.js";
import { Router } from "express";

export const userRouter = Router();

userRouter.route("/").get(getAllUsers);
