import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

// Toggle an emoji reaction on a message.
export const POST = route(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const { emoji } = await req.json().catch(() => ({}));
  if (!emoji) return ok({ ok: false });

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    include: { conversation: { include: { members: { select: { userId: true } } } } },
  });
  if (!message) return notFound("Message not found");
  if (!message.conversation.members.some((m) => m.userId === me.id)) return forbidden();

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId: params.id, userId: me.id, emoji } },
  });
  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    // one reaction per user per message: clear any previous emoji first
    await prisma.messageReaction.deleteMany({ where: { messageId: params.id, userId: me.id } });
    await prisma.messageReaction.create({ data: { messageId: params.id, userId: me.id, emoji } });
  }
  const reactions = await prisma.messageReaction.findMany({ where: { messageId: params.id } });
  return ok({ reactions: reactions.map((r) => ({ emoji: r.emoji, userId: r.userId })) });
});
