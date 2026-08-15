import { NextRequest } from "next/server";
import { route, ok, bad, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser, serializeMessage } from "@/lib/serialize";
import { isBlockedBetween } from "@/lib/social";

export const dynamic = "force-dynamic";

// List my conversations with last message + unread count, newest activity first.
export const GET = route(async () => {
  const me = await requireUser();
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: me.id },
    include: {
      conversation: {
        include: {
          members: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } },
        },
      },
    },
  });

  const items = await Promise.all(
    memberships.map(async (m) => {
      const convo = m.conversation;
      const unread = await prisma.message.count({
        where: { conversationId: convo.id, createdAt: { gt: m.lastReadAt }, senderId: { not: me.id } },
      });
      const others = convo.members.filter((mm) => mm.userId !== me.id).map((mm) => publicUser(mm.user));
      const last = convo.messages[0];
      return {
        id: convo.id,
        isGroup: convo.isGroup,
        name: convo.name,
        avatar: convo.avatar,
        updatedAt: convo.updatedAt,
        members: others,
        unread,
        lastMessage: last ? serializeMessage(last, me.id) : null,
      };
    })
  );

  items.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  return ok({ conversations: items });
});

// Start (or find) a 1:1, or create a group.
export const POST = route(async (req: NextRequest) => {
  const me = await requireUser();
  const { userId, userIds, name, isGroup } = await req.json().catch(() => ({}));

  if (isGroup || (Array.isArray(userIds) && userIds.length > 1)) {
    const ids: string[] = Array.from(new Set([me.id, ...(userIds || [])]));
    const convo = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: name || null,
        members: { create: ids.map((id) => ({ userId: id, isAdmin: id === me.id })) },
      },
    });
    return ok({ id: convo.id });
  }

  if (!userId) return bad("Pick someone to message.");
  // Can't start a 1:1 with someone you've blocked or who has blocked you.
  if (await isBlockedBetween(me.id, userId)) return forbidden();
  // Find an existing 1:1 with exactly these two members.
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: me.id } } },
        { members: { some: { userId } } },
      ],
    },
    include: { _count: { select: { members: true } } },
  });
  if (existing && existing._count.members === 2) return ok({ id: existing.id });

  const convo = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: { create: [{ userId: me.id }, { userId }] },
    },
  });
  return ok({ id: convo.id });
});
