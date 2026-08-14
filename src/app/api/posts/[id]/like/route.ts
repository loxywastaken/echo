import { NextRequest } from "next/server";
import { route, ok, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true, authorId: true } });
  if (!post) return notFound("Post not found");

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId: post.id, userId: user.id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { postId: post.id, userId: user.id } });
    liked = true;
    await notify({ recipientId: post.authorId, actorId: user.id, type: NOTIF.LIKE, postId: post.id });
  }

  const likeCount = await prisma.like.count({ where: { postId: post.id } });
  return ok({ liked, likeCount });
});
