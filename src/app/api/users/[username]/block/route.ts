import { NextRequest } from "next/server";
import { route, ok, bad, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { username: string } };

async function target(username: string) {
  return prisma.user.findUnique({ where: { username: username.toLowerCase() } });
}

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const t = await target(params.username);
  if (!t) return notFound("Account not found");
  if (t.id === me.id) return bad("You can't block yourself.");

  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: me.id, blockedId: t.id } },
      create: { blockerId: me.id, blockedId: t.id },
      update: {},
    }),
    // Blocking severs the follow graph both ways + any pending requests.
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: me.id, followingId: t.id },
          { followerId: t.id, followingId: me.id },
        ],
      },
    }),
    prisma.followRequest.deleteMany({
      where: {
        OR: [
          { fromId: me.id, toId: t.id },
          { fromId: t.id, toId: me.id },
        ],
      },
    }),
  ]);
  return ok({ blocked: true });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const t = await target(params.username);
  if (!t) return notFound("Account not found");
  await prisma.block.deleteMany({ where: { blockerId: me.id, blockedId: t.id } });
  return ok({ blocked: false });
});
