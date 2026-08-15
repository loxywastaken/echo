import { NextRequest } from "next/server";
import { route, ok, bad, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { messageSchema, firstError } from "@/lib/validators";
import { serializeMessage } from "@/lib/serialize";
import { notify } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";
import { getTyping } from "@/lib/presence";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

async function assertMember(convoId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: convoId, userId } },
  });
  return member;
}

// Fetch messages (optionally only those after ?after=<messageId> for polling).
export const GET = route(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const member = await assertMember(params.id, me.id);
  if (!member) return forbidden();

  const after = new URL(req.url).searchParams.get("after");
  let afterDate: Date | undefined;
  if (after) {
    const m = await prisma.message.findUnique({ where: { id: after }, select: { createdAt: true } });
    afterDate = m?.createdAt;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id, ...(afterDate ? { createdAt: { gt: afterDate } } : {}) },
    include: { sender: true, reactions: true, replyTo: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  // Other members' read cursor (for read receipts).
  const others = await prisma.conversationMember.findMany({
    where: { conversationId: params.id, userId: { not: me.id } },
    select: { userId: true, lastReadAt: true },
  });

  return ok({
    messages: messages.map((m) => serializeMessage(m, me.id)),
    readCursors: others.map((o) => ({ userId: o.userId, lastReadAt: o.lastReadAt })),
    typing: getTyping(params.id, me.id),
  });
});

// Send a message.
export const POST = route(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const member = await assertMember(params.id, me.id);
  if (!member) return forbidden();

  const parsed = messageSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const d = parsed.data;
  if (!d.body?.trim() && !d.mediaUrl) return bad("Message can't be empty.");

  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    select: { isGroup: true },
  });
  const others = await prisma.conversationMember.findMany({
    where: { conversationId: params.id, userId: { not: me.id } },
    select: { userId: true },
  });
  const otherIds = others.map((o) => o.userId);
  // In a 1:1, don't allow messaging someone who has blocked you (or whom you've blocked).
  if (!convo?.isGroup && otherIds.length) {
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: me.id, blockedId: { in: otherIds } },
          { blockerId: { in: otherIds }, blockedId: me.id },
        ],
      },
    });
    if (blocked) return forbidden();
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: me.id,
        body: d.body?.trim() || null,
        mediaUrl: d.mediaUrl,
        mediaType: d.mediaType,
        replyToId: d.replyToId || null,
      },
      include: { sender: true, reactions: true, replyTo: true },
    }),
    prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } }),
    prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId: params.id, userId: me.id } },
      data: { lastReadAt: new Date() },
    }),
  ]);

  // Notify the other members.
  await Promise.all(
    otherIds.map((userId) =>
      notify({ recipientId: userId, actorId: me.id, type: NOTIF.MESSAGE, message: d.body?.slice(0, 60) })
    )
  );

  return ok({ message: serializeMessage(message, me.id) });
});
