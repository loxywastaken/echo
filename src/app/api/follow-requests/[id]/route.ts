import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";

type Ctx = { params: { id: string } };

// Accept a follow request.
export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const request = await prisma.followRequest.findUnique({ where: { id: params.id } });
  if (!request) return notFound("Request not found");
  if (request.toId !== me.id) return forbidden();

  await prisma.$transaction([
    prisma.follow.upsert({
      where: { followerId_followingId: { followerId: request.fromId, followingId: me.id } },
      create: { followerId: request.fromId, followingId: me.id },
      update: {},
    }),
    prisma.followRequest.delete({ where: { id: request.id } }),
  ]);
  await notify({ recipientId: request.fromId, actorId: me.id, type: NOTIF.FOLLOW, message: "accepted your request" });
  return ok({ accepted: true });
});

// Decline / delete a follow request.
export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const request = await prisma.followRequest.findUnique({ where: { id: params.id } });
  if (!request) return notFound("Request not found");
  if (request.toId !== me.id) return forbidden();
  await prisma.followRequest.delete({ where: { id: request.id } });
  return ok({ declined: true });
});
