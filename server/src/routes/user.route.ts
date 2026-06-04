import { getAllUsers, getOneUser, deleteUser } from "@controllers/user.controller.js";
import { Router } from "express";

export const userRouter = Router();

userRouter.route("/").get(getAllUsers);
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
