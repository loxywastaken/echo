import { NextRequest } from "next/server";
import { route, ok, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { username: string } };

// Remove [username] from *my* followers.
export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const follower = await prisma.user.findUnique({ where: { username: params.username.toLowerCase() } });
  if (!follower) return notFound("Account not found");

  await prisma.follow.deleteMany({ where: { followerId: follower.id, followingId: me.id } });
  const followerCount = await prisma.follow.count({ where: { followingId: me.id } });
  return ok({ ok: true, followerCount });
});
