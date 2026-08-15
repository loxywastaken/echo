import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";
import { invisibleUserIds, visiblePostWhere } from "@/lib/social";

export const dynamic = "force-dynamic";

// Unified search across people, hashtags, posts (by caption) and locations.
export const GET = route(async (req: NextRequest) => {
  const viewer = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type") || "all"; // all | people | hashtags | posts | locations

  if (!q) return ok({ people: [], hashtags: [], posts: [], locations: [] });

  const hidden = viewer ? await invisibleUserIds(viewer.id) : [];
  const wantAll = type === "all";
  // Restrict post/location results to content the viewer is allowed to see.
  const postVisibility = await visiblePostWhere(viewer?.id ?? null);

  const [people, hashtags, posts, locations] = await Promise.all([
    wantAll || type === "people"
      ? prisma.user.findMany({
          where: {
            id: { notIn: hidden },
            status: { not: "banned" },
            OR: [
              { username: { contains: q.toLowerCase() } },
              { displayName: { contains: q } },
            ],
          },
          include: { _count: { select: { followers: true } } },
          take: wantAll ? 6 : 30,
        })
      : Promise.resolve([]),
    wantAll || type === "hashtags"
      ? prisma.hashtag.findMany({
          where: { tag: { contains: q.toLowerCase().replace(/^#/, "") } },
          include: { _count: { select: { posts: true } } },
          orderBy: { posts: { _count: "desc" } },
          take: wantAll ? 6 : 30,
        })
      : Promise.resolve([]),
    wantAll || type === "posts"
      ? prisma.post.findMany({
          where: { status: "published", authorId: { notIn: hidden }, caption: { contains: q }, ...postVisibility },
          include: { media: { take: 1, orderBy: { position: "asc" } } },
          orderBy: { createdAt: "desc" },
          take: wantAll ? 9 : 30,
        })
      : Promise.resolve([]),
    wantAll || type === "locations"
      ? prisma.post.findMany({
          where: { status: "published", location: { contains: q }, authorId: { notIn: hidden }, ...postVisibility },
          select: { location: true },
          distinct: ["location"],
          take: wantAll ? 6 : 30,
        })
      : Promise.resolve([]),
  ]);

  return ok({
    people: (people as any[]).map((u) => ({ ...publicUser(u), followers: u._count.followers })),
    hashtags: (hashtags as any[]).map((h) => ({ tag: h.tag, count: h._count.posts })),
    posts: (posts as any[]).map((p) => ({ id: p.id, thumb: p.media[0]?.url ?? null, type: p.media[0]?.type })),
    locations: (locations as any[]).map((p) => p.location).filter(Boolean),
  });
});
