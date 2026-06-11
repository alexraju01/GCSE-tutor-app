import { signUp, login } from "@controllers/auth.controller.js";
import { getAllUsers, getOneUser, deleteUser } from "@controllers/user.controller.js";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registrationSchema } from "../schemas/auth.schema.js";

export const userRouter = Router();

userRouter.route("/").get(getAllUsers);
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
userRouter.route("/signup").post(validate(registrationSchema), signUp);
userRouter.route("/login").post(login);
