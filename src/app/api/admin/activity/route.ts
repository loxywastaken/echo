import { route, ok, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Recent platform activity feed for the admin dashboard.
export const GET = route(async () => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();

  const [posts, users] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { author: true, media: { take: 1, orderBy: { position: "asc" } } },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return ok({
    recentPosts: posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      status: p.status,
      thumb: p.media[0]?.url ?? null,
      createdAt: p.createdAt,
      author: publicUser(p.author),
    })),
    recentUsers: users.map((u) => ({ ...publicUser(u), createdAt: u.createdAt, status: u.status })),
  });
});
