import { prisma } from "@db/prisma.js";
import { NotificationStatus } from "@generated/client.js";

// email/sms/push etc. throwing marks the attempt failed and it gets retried
export interface NotificationSender {
  send(message: { to: string; name: string | null; title: string; body: string }): Promise<void>;
}

// just logs for now - TODO: swap for a real email provider (Resend/SES etc)
export const logSender: NotificationSender = {
  send: ({ to, title, body }) => {
    console.info(`[Notify] → ${to}: ${title}\n${body}`);
    return Promise.resolve();
  },
};

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

export const deliverPendingNotifications = async (sender: NotificationSender = logSender) => {
  const pending = await prisma.notification.findMany({
    where: { status: NotificationStatus.Pending },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: {
      id: true,
      title: true,
      body: true,
      attempts: true,
      user: { select: { email: true, name: true } },
    },
  });

  let sent = 0;
  for (const notification of pending) {
    try {
      await sender.send({
        to: notification.user.email,
        name: notification.user.name,
        title: notification.title,
        body: notification.body,
      });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.Sent, sentAt: new Date(), attempts: { increment: 1 } },
      });
      sent++;
    } catch (error) {
      const attempts = notification.attempts + 1;
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          attempts,
          lastError: error instanceof Error ? error.message : String(error),
          ...(attempts >= MAX_ATTEMPTS && { status: NotificationStatus.Failed }),
        },
      });
    }
  }

  return sent;
};
