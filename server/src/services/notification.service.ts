import { prisma } from "@db/prisma.js";
import { NotificationType, type Prisma } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";

type Db = Prisma.TransactionClient;

export interface NotificationInput {
  userId: string;
  lessonId?: string;
  type: NotificationType;
  title: string;
  body: string;
}

// takes the caller's transaction so the notification commits/rolls back with it
export const enqueueNotifications = async (db: Db, notifications: NotificationInput[]) => {
  if (notifications.length === 0) return;
  await db.notification.createMany({ data: notifications });
};

export const listNotificationsForUser = async (userId: string, limit = 20) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        lessonId: true,
        type: true,
        title: true,
        body: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { notifications, unreadCount };
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const { count } = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });

  if (count === 0) {
    const exists = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });
    if (!exists) throw new AppError("No notification found with that ID.", 404);
  }
};

export const markAllNotificationsRead = (userId: string) =>
  prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
