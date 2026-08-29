import { prisma } from "@db/prisma.js";
import cron from "node-cron";

const purgeExpiredAvailabilities = async (): Promise<void> => {
  try {
    const result = await prisma.availability.deleteMany({
      where: {
        endTime: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      console.log(`[Worker] Purged ${result.count} expired availability slots.`);
    }
  } catch (error) {
    console.error("[Worker] Error during availability cleanup:", error);
  }
};

export const startAvailabilityWorker = (): void => {
  console.log("[Worker] Availability cleanup worker running every 5 minutes.");

  // Mark immediate execution with void operator
  void purgeExpiredAvailabilities();

  // Schedule every 5 minutes & mark promise as void to satisfy ESLint
  cron.schedule("*/5 * * * *", () => {
    void purgeExpiredAvailabilities();
  });
};

// Run directly if invoked as entrypoint
startAvailabilityWorker();
