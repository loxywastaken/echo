import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

type Ctx = { params: { id: string } };

// Owner-only viewer list for a story ("seen by").
export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const story = await prisma.story.findUnique({ where: { id: params.id } });
  if (!story) return notFound("Story not found");
  if (story.authorId !== me.id) return forbidden();

  const views = await prisma.storyView.findMany({
    where: { storyId: story.id },
    include: { viewer: true },
    orderBy: { createdAt: "desc" },
  });
  const reactions = await prisma.storyReaction.findMany({
    where: { storyId: story.id },
    include: { user: true },
  });
  return ok({
    viewCount: views.length,
    viewers: views.map((v) => ({ ...publicUser(v.viewer), at: v.createdAt })),
    reactions: reactions.map((r) => ({ ...publicUser(r.user), emoji: r.emoji })),
  });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const story = await prisma.story.findUnique({ where: { id: params.id } });
  if (!story) return notFound("Story not found");
  if (story.authorId !== me.id) return forbidden();
  await prisma.story.delete({ where: { id: story.id } });
  return ok({ ok: true });
});
