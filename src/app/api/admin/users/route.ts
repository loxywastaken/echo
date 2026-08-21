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
      badgeType: u.badgeType ?? "blue",
      createdAt: u.createdAt,
      posts: u._count.posts,
      followers: u._count.followers,
    })),
  });
});

// Suspend / ban / reactivate / (un)verify a user.
export const PATCH = route(async (req: NextRequest) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const { id, action } = await req.json().catch(() => ({}));
  if (!id) return bad("Missing user id.");
  const badgeActions = ["verify", "verify-gold", "verify-gray", "unverify"];
  if (id === me.id && !badgeActions.includes(action)) return bad("You can't moderate your own account.");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return bad("User not found.");
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
    case "verify":
      await prisma.user.update({ where: { id }, data: { isVerified: true, badgeType: "blue" } });
      break;
    case "verify-gold":
      await prisma.user.update({ where: { id }, data: { isVerified: true, badgeType: "gold" } });
      break;
    case "verify-gray":
      await prisma.user.update({ where: { id }, data: { isVerified: true, badgeType: "gray" } });
      break;
    case "unverify":
      await prisma.user.update({ where: { id }, data: { isVerified: false } });
      break;
    default:
      return bad("Unknown action.");
  }
  return ok({ ok: true });
});
