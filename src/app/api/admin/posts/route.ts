import { NextRequest } from "next/server";
import { route, ok, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Content moderation list — recent posts with search, for the admin dashboard.
export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();

  const posts = await prisma.post.findMany({
    where: q
      ? { OR: [{ caption: { contains: q } }, { author: { username: { contains: q } } }] }
      : {},
    include: {
      author: true,
      media: { take: 1, orderBy: { position: "asc" } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return ok({
    posts: posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      status: p.status,
      isClip: p.isClip,
      thumb: p.media[0]?.url ?? null,
      type: p.media[0]?.type ?? null,
      author: publicUser(p.author),
      likes: p._count.likes,
      comments: p._count.comments,
      createdAt: p.createdAt,
    })),
  });
});
