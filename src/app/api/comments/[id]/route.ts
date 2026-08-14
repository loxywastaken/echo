import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
    include: { post: { select: { authorId: true } } },
  });
  if (!comment) return notFound("Comment not found");
  // Comment author, the post owner, or an admin may delete.
  const canDelete =
    comment.authorId === user.id ||
    comment.post.authorId === user.id ||
    user.role === "admin";
  if (!canDelete) return forbidden();

  await prisma.comment.delete({ where: { id: params.id } });
  return ok({ ok: true });
});
