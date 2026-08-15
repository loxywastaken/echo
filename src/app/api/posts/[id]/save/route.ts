import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invisibleUserIds, canViewContent } from "@/lib/social";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, status: true, author: { select: { id: true, isPrivate: true } } },
  });
  if (!post || post.status !== "published") return notFound("Post not found");

  // Block + privacy enforcement (mirrors the post-detail route).
  const hidden = await invisibleUserIds(user.id);
  if (hidden.includes(post.authorId)) return notFound("Post not found");
  if (!(await canViewContent(user.id, post.author))) return forbidden();

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
