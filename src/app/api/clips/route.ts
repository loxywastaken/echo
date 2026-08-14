import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postInclude, serializePost } from "@/lib/serialize";
import { invisibleUserIds } from "@/lib/social";

export const dynamic = "force-dynamic";

// Echo Clips — vertical short-form video feed.
export const GET = route(async (req: NextRequest) => {
  const viewer = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 5, 15);
  const hidden = viewer ? await invisibleUserIds(viewer.id) : [];

  const clips = await prisma.post.findMany({
    where: { isClip: true, status: "published", authorId: { notIn: hidden } },
    include: postInclude(viewer?.id),
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = clips.length > limit;
  const page = hasMore ? clips.slice(0, limit) : clips;
  return ok({
    clips: page.map((p) => serializePost(p, viewer?.id)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
