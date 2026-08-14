import { NextRequest } from "next/server";
import { route, ok, bad, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";

type Ctx = { params: { username: string } };

async function target(username: string) {
  return prisma.user.findUnique({ where: { username: username.toLowerCase() } });
}

// Follow (or, for private accounts, send a follow request).
export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const t = await target(params.username);
  if (!t) return notFound("Account not found");
  if (t.id === me.id) return bad("You can't follow yourself.");

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: t.id, blockedId: me.id },
        { blockerId: me.id, blockedId: t.id },
      ],
    },
  });
  if (blocked) return forbidden();

  if (t.isPrivate) {
    const already = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: t.id } },
    });
    if (already) return ok({ following: true, requested: false });
    await prisma.followRequest.upsert({
      where: { fromId_toId: { fromId: me.id, toId: t.id } },
      create: { fromId: me.id, toId: t.id },
      update: {},
    });
    await notify({ recipientId: t.id, actorId: me.id, type: NOTIF.FOLLOW_REQUEST });
    return ok({ following: false, requested: true });
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: me.id, followingId: t.id } },
    create: { followerId: me.id, followingId: t.id },
    update: {},
  });
  await notify({ recipientId: t.id, actorId: me.id, type: NOTIF.FOLLOW });
  const followerCount = await prisma.follow.count({ where: { followingId: t.id } });
  return ok({ following: true, requested: false, followerCount });
});

// Unfollow, or cancel a pending request.
export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const t = await target(params.username);
  if (!t) return notFound("Account not found");

  await prisma.follow.deleteMany({ where: { followerId: me.id, followingId: t.id } });
  await prisma.followRequest.deleteMany({ where: { fromId: me.id, toId: t.id } });
  const followerCount = await prisma.follow.count({ where: { followingId: t.id } });
  return ok({ following: false, requested: false, followerCount });
});
