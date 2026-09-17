import { signUp, login, logout } from "@controllers/auth.controller.js";
import {
  getAllUsers,
  getOneUser,
  deleteUser,
  updateMe,
  getUserProfile,
} from "@controllers/user.controller.js";
import { Role } from "@generated/enums.js";
import { validate, protect, authorize, authLimiter } from "@middleware";
import { registrationSchema, updateUserSchema } from "@schemas";
import { Router } from "express";

export const userRouter = Router();

// 1. Public auth routes, rate limited so people can't brute force logins
userRouter.route("/signup").post(authLimiter, validate(registrationSchema), signUp);
userRouter.route("/login").post(authLimiter, login);
userRouter.route("/logout").post(logout);

// 2. Specific authenticated user routes (BEFORE dynamic parameter routes)
userRouter.route("/profile").get(protect, getUserProfile);
userRouter.patch("/me", protect, validate(updateUserSchema), updateMe);

// 3. Admin-only user management
userRouter.use(protect, authorize(Role.Admin));
userRouter.route("/").get(getAllUsers);
userRouter.route("/:id").get(getOneUser).delete(deleteUser);
