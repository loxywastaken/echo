import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postInclude, serializePost, publicUser } from "@/lib/serialize";
import { invisibleUserIds } from "@/lib/social";

export const dynamic = "force-dynamic";

// Explore grid + trending hashtags + recommended creators. Ranking is a simple
// recency + engagement blend (good enough without a real recsys).
export const GET = route(async (req: NextRequest) => {
  const viewer = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 15, 30);

  const hidden = viewer ? await invisibleUserIds(viewer.id) : [];
  const where: any = {
    status: "published",
    authorId: { notIn: [...(viewer ? [viewer.id] : []), ...hidden] },
  };

  const posts = await prisma.post.findMany({
    where,
    include: postInclude(viewer?.id),
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;

  // Extras only on the first page.
  let trending: { tag: string; count: number }[] = [];
  let creators: any[] = [];
  if (!cursor) {
    const tags = await prisma.hashtag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
      take: 10,
    });
    trending = tags
      .map((t) => ({ tag: t.tag, count: t._count.posts }))
      .filter((t) => t.count > 0);

    const followingIds = viewer
      ? (await prisma.follow.findMany({ where: { followerId: viewer.id }, select: { followingId: true } })).map(
          (f) => f.followingId
        )
      : [];
    const recs = await prisma.user.findMany({
      where: {
        id: { notIn: [...(viewer ? [viewer.id] : []), ...followingIds, ...hidden] },
        status: "active",
      },
      orderBy: { followers: { _count: "desc" } },
      take: 6,
      include: { _count: { select: { followers: true } } },
    });
    creators = recs.map((u) => ({ ...publicUser(u), followers: u._count.followers }));
  }

  return ok({
    posts: page.map((p) => serializePost(p, viewer?.id)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
    trending,
    creators,
  });
});
