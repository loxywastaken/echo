import { NextRequest } from "next/server";
import { route, ok, bad, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const status = new URL(req.url).searchParams.get("status") || "open";

  const reports = await prisma.report.findMany({
    where: status === "all" ? {} : { status: status === "open" ? { in: ["open", "reviewing"] } : status },
    include: {
      reporter: true,
      reportedUser: true,
      post: { include: { author: true, media: { take: 1, orderBy: { position: "asc" } } } },
      comment: { include: { author: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok({
    reports: reports.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      reporter: publicUser(r.reporter),
      reportedUser: r.reportedUser ? publicUser(r.reportedUser) : null,
      post: r.post
        ? { id: r.post.id, caption: r.post.caption, thumb: r.post.media[0]?.url ?? null, author: publicUser(r.post.author) }
        : null,
      comment: r.comment ? { id: r.comment.id, body: r.comment.body, author: publicUser(r.comment.author) } : null,
    })),
  });
});

// Update a report's status (reviewing / resolved / dismissed).
export const PATCH = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const { id, status } = await req.json().catch(() => ({}));
  if (!id || !["open", "reviewing", "resolved", "dismissed"].includes(status)) return bad("Invalid update.");
  await prisma.report.update({ where: { id }, data: { status } });
  return ok({ ok: true });
});
