import { NextRequest } from "next/server";
import { route, ok, bad, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ username: { contains: q } }, { displayName: { contains: q } }, { email: { contains: q } }] }
      : {},
    include: { _count: { select: { posts: true, followers: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return ok({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      status: u.status,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      posts: u._count.posts,
      followers: u._count.followers,
    })),
  });
});

// Moderate a user: (un)verify (incl. yourself), grant/revoke admin, suspend/ban/reactivate.
export const PATCH = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const { id, action } = await req.json().catch(() => ({}));
  if (!id) return bad("Missing user id.");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return bad("User not found.");
  const isSelf = id === me.id;

  // Verification is non-destructive — allowed on anyone, including yourself.
  if (action === "verify" || action === "unverify") {
    await prisma.user.update({ where: { id }, data: { isVerified: action === "verify" } });
    return ok({ ok: true });
  }

  // Role management (owner tools).
  if (action === "makeAdmin") {
    await prisma.user.update({ where: { id }, data: { role: "admin" } });
    return ok({ ok: true });
  }
  if (action === "removeAdmin") {
    if (isSelf) return bad("You can't remove your own admin access.");
    await prisma.user.update({ where: { id }, data: { role: "user" } });
    return ok({ ok: true });
  }

  // Destructive moderation: never on yourself, never on another admin.
  if (isSelf) return bad("You can't suspend or ban your own account.");
  if (target.role === "admin") return bad("You can't moderate another admin.");

  switch (action) {
    case "suspend":
      await prisma.user.update({ where: { id }, data: { status: "suspended" } });
      break;
    case "ban":
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { status: "banned" } }),
        prisma.session.deleteMany({ where: { userId: id } }),
      ]);
      break;
    case "activate":
      await prisma.user.update({ where: { id }, data: { status: "active" } });
      break;
    default:
      return bad("Unknown action.");
  }
  return ok({ ok: true });
});
