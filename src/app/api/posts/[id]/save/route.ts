import { NextRequest } from "next/server";
import { route, ok, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!post) return notFound("Post not found");

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId: post.id, userId: user.id } },
  });
  let saved: boolean;
  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
    saved = false;
  } else {
    await prisma.savedPost.create({ data: { postId: post.id, userId: user.id } });
    saved = true;
  }
  return ok({ saved });
});
