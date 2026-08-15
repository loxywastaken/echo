import "server-only";
import { prisma } from "@/lib/db";

/** Read the singleton app config, creating it on first access. */
export async function getAppConfig() {
  const c = await prisma.appConfig.upsert({
    where: { id: "app" },
    update: {},
    create: { id: "app" },
  });
  return { maintenanceMode: c.maintenanceMode, maintenanceMessage: c.maintenanceMessage };
}
