import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeNotification } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const me = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { recipientId: me.id },
    include: {
      actor: true,
      post: { include: { media: { take: 1, orderBy: { position: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = notifications.filter((n) => !n.read).length;
  return ok({ notifications: notifications.map(serializeNotification), unread });
});

// Mark all as read.
export const PATCH = route(async () => {
  const me = await requireUser();
  await prisma.notification.updateMany({
    where: { recipientId: me.id, read: false },
    data: { read: true },
  });
  return ok({ ok: true });
});
