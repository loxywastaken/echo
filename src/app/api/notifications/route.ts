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

  // Which actors the viewer already follows (so follow notifications can show
  // the correct "Following" vs "Follow" state).
  const actorIds = Array.from(
    new Set(notifications.map((n) => n.actorId).filter((id): id is string => !!id))
  );
  const following = actorIds.length
    ? await prisma.follow.findMany({
        where: { followerId: me.id, followingId: { in: actorIds } },
        select: { followingId: true },
      })
    : [];
  const followingSet = new Set(following.map((f) => f.followingId));

  const unread = notifications.filter((n) => !n.read).length;
  return ok({
    notifications: notifications.map((n) =>
      serializeNotification(n, { followsActor: n.actorId ? followingSet.has(n.actorId) : false })
    ),
    unread,
  });
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
