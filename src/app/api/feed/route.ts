import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postInclude, serializePost } from "@/lib/serialize";
import { invisibleUserIds } from "@/lib/social";
import { PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Personalised home feed: posts from people you follow + your own, newest first.
// If you follow no-one yet, we backfill with recent public posts so the feed is
// never empty. Cursor-paginated for infinite scroll.
export const GET = route(async (req: NextRequest) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || PAGE_SIZE, 20);

  const [following, hidden] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
    invisibleUserIds(user.id),
  ]);
  const followingIds = following.map((f) => f.followingId);
  const authorIds = [user.id, ...followingIds].filter((id) => !hidden.includes(id));

  // Primary source: followed + self. Backfill with everyone (minus hidden) if sparse.
  const useGlobal = followingIds.length === 0;
  const where: any = useGlobal
    ? { status: "published", isClip: false, authorId: { notIn: hidden } }
    : { status: "published", isClip: false, authorId: { in: authorIds } };

  const posts = await prisma.post.findMany({
    where,
    include: postInclude(user.id),
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  return ok({
    posts: page.map((p) => serializePost(p, user.id)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});
