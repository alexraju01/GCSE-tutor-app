import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import type { Request, Response } from "express";

export const getMyNotifications = async (req: Request, res: Response) => {
  const { notifications, unreadCount } = await listNotificationsForUser(req.user.id);

  return res.status(200).json({
    status: "success",
    results: notifications.length,
    unreadCount,
    data: notifications,
  });
};

export const readNotification = async (req: Request<{ id: string }>, res: Response) => {
  await markNotificationRead(req.user.id, req.params.id);
  return res.status(204).send();
};

export const readAllNotifications = async (req: Request, res: Response) => {
  await markAllNotificationsRead(req.user.id);
  return res.status(204).send();
};
