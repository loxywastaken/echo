import { NextRequest } from "next/server";
import { route, ok, bad, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";

type Ctx = { params: { id: string } };

export const POST = route(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const { emoji } = await req.json().catch(() => ({ emoji: "❤️" }));
  const story = await prisma.story.findUnique({ where: { id: params.id }, select: { id: true, authorId: true } });
  if (!story) return notFound("Story not found");
  if (story.authorId === me.id) return bad("You can't react to your own story.");

  const chosen = emoji || "❤️";
  // Dedupe by (storyId, userId): one reaction per user. Update the emoji in place
  // on repeat taps and only notify the author when the reaction is newly created.
  const existing = await prisma.storyReaction.findFirst({
    where: { storyId: story.id, userId: me.id },
  });
  if (existing) {
    if (existing.emoji !== chosen) {
      await prisma.storyReaction.update({ where: { id: existing.id }, data: { emoji: chosen } });
    }
    return ok({ ok: true });
  }

  await prisma.storyReaction.create({
    data: { storyId: story.id, userId: me.id, emoji: chosen },
  });
  await notify({ recipientId: story.authorId, actorId: me.id, type: NOTIF.LIKE, message: `reacted ${chosen} to your story` });
  return ok({ ok: true });
});
