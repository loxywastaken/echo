import { route, ok, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();

  const c = await prisma.appConfig.upsert({
    where: { id: "app" },
    update: {},
    create: { id: "app" },
  });
  return ok({ maintenanceMode: c.maintenanceMode, maintenanceMessage: c.maintenanceMessage });
});

export const PATCH = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();

  const body = await req.json().catch(() => ({}));
  const data: { maintenanceMode?: boolean; maintenanceMessage?: string } = {};
  if (typeof body.maintenanceMode === "boolean") data.maintenanceMode = body.maintenanceMode;
  if (typeof body.maintenanceMessage === "string") data.maintenanceMessage = body.maintenanceMessage;

  const c = await prisma.appConfig.upsert({
    where: { id: "app" },
    update: data,
    create: { id: "app", ...data },
  });
  return ok({ maintenanceMode: c.maintenanceMode, maintenanceMessage: c.maintenanceMessage });
});
