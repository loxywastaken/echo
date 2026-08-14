import { NextRequest } from "next/server";
import { route, ok, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const comment = await prisma.comment.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!comment) return notFound("Comment not found");

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: comment.id, userId: user.id } },
  });
  let liked: boolean;
  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.commentLike.create({ data: { commentId: comment.id, userId: user.id } });
    liked = true;
  }
  const likeCount = await prisma.commentLike.count({ where: { commentId: comment.id } });
  return ok({ liked, likeCount });
});
