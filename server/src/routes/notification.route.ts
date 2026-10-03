import {
  getMyNotifications,
  readAllNotifications,
  readNotification,
} from "@controllers/notification.controller.js";
import { protect } from "@middleware";
import { Router } from "express";

export const notificationRouter = Router();

notificationRouter.use(protect);

// /notifications/me — latest notifications + unread count
notificationRouter.get("/me", getMyNotifications);

// /notifications/read-all — must come before /:id
notificationRouter.patch("/read-all", readAllNotifications);

// /notifications/:id/read
notificationRouter.patch("/:id/read", readNotification);
