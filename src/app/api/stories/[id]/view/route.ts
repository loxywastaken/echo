import { NextRequest } from "next/server";
import { route, ok, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const story = await prisma.story.findUnique({ where: { id: params.id }, select: { id: true, authorId: true } });
  if (!story) return notFound("Story not found");
  if (story.authorId !== me.id) {
    await prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId: story.id, viewerId: me.id } },
      create: { storyId: story.id, viewerId: me.id },
      update: {},
    });
  }
  const viewCount = await prisma.storyView.count({ where: { storyId: story.id } });
  return ok({ ok: true, viewCount });
});
