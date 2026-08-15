import { route, ok, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const [users, posts, comments, openReports, activeStories, suspended, banned, verified] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { status: "published" } }),
    prisma.comment.count(),
    prisma.report.count({ where: { status: { in: ["open", "reviewing"] } } }),
    prisma.story.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.user.count({ where: { status: "suspended" } }),
    prisma.user.count({ where: { status: "banned" } }),
    prisma.user.count({ where: { isVerified: true } }),
  ]);

  // 7-day new-posts series for the activity chart.
  const series: { label: string; posts: number; users: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(now - (i + 1) * dayMs);
    const end = new Date(now - i * dayMs);
    const [p, u] = await Promise.all([
      prisma.post.count({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
    ]);
    series.push({
      label: end.toLocaleDateString(undefined, { weekday: "short" }),
      posts: p,
      users: u,
    });
  }

  return ok({
    stats: { users, posts, comments, openReports, activeStories, suspended, banned, verified },
    series,
  });
});
