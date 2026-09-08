import { signUp, login, logout } from "@controllers/auth.controller.js";
import {
  getAllUsers,
  getOneUser,
  deleteUser,
  updateMe,
  getUserProfile,
} from "@controllers/user.controller.js";
import { validate, protect } from "@middleware";
import { registrationSchema, updateUserSchema } from "@schemas";
import { Router } from "express";

export const userRouter = Router();

// 1. Static root & auth routes
userRouter.route("/").get(getAllUsers);
userRouter.route("/signup").post(validate(registrationSchema), signUp);
userRouter.route("/login").post(login);
userRouter.route("/logout").post(logout);

// 2. Specific authenticated user routes (BEFORE dynamic parameter routes)
userRouter.route("/profile").get(protect, getUserProfile);
userRouter.patch("/me", protect, validate(updateUserSchema), updateMe);

// 3. Dynamic parameter routes at the bottom
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
