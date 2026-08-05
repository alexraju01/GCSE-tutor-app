import { signUp, login, logout } from "@controllers/auth.controller.js";
import { getAllUsers, getOneUser, deleteUser, updateMe } from "@controllers/user.controller.js";
import { validate, protect } from "@middleware";
import { registrationSchema, updateUserSchema } from "@schemas";
import { Router } from "express";

export const userRouter = Router();

userRouter.route("/").get(getAllUsers);
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
userRouter.route("/signup").post(validate(registrationSchema), signUp);
userRouter.route("/login").post(login);
userRouter.route("/logout").post(logout);

userRouter.patch("/me", protect, validate(updateUserSchema), updateMe);
