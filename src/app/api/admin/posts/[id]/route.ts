import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";

type Ctx = { params: { id: string } };

// Admin removes a post (soft-remove so it disappears from feeds but stays auditable).
export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return notFound("Post not found");
  await prisma.post.update({ where: { id: params.id }, data: { status: "removed" } });
  await prisma.report.updateMany({ where: { postId: params.id, status: { in: ["open", "reviewing"] } }, data: { status: "resolved" } });
  await notify({ recipientId: post.authorId, type: NOTIF.ADMIN, message: "A post was removed for violating our guidelines." });
  return ok({ ok: true });
});
