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

  await prisma.storyReaction.create({
    data: { storyId: story.id, userId: me.id, emoji: emoji || "❤️" },
  });
  await notify({ recipientId: story.authorId, actorId: me.id, type: NOTIF.LIKE, message: `reacted ${emoji || "❤️"} to your story` });
  return ok({ ok: true });
});
