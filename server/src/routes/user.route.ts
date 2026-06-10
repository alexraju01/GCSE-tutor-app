import { signUp, login } from "@controllers/auth.controller.js";
import { getAllUsers, getOneUser, deleteUser } from "@controllers/user.controller.js";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { userSchema } from "../schemas/user.schema.js";

export const userRouter = Router();

userRouter.route("/").get(getAllUsers);
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
userRouter.route("/signup").post(validate(userSchema), signUp);
userRouter.route("/login").post(login);
