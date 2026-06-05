import { signUp } from "@controllers/auth.controller.js";
import { getAllUsers, getOneUser, deleteUser } from "@controllers/user.controller.js";
import { Router } from "express";

export const userRouter = Router();

userRouter.route("/").get(getAllUsers);
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
userRouter.route("/signup").post(signUp);
