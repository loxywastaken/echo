import { NextRequest } from "next/server";
import { route, ok, bad, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reportSchema, firstError } from "@/lib/validators";

export const POST = route(async (req: NextRequest) => {
  const me = await requireUser();
  const parsed = reportSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const { targetType, targetId, reason, details } = parsed.data;

  const data: any = { reporterId: me.id, targetType, reason, details, status: "open" };
  if (targetType === "post") {
    const p = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!p) return notFound("Post not found");
    data.postId = targetId;
  } else if (targetType === "comment") {
    const c = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!c) return notFound("Comment not found");
    data.commentId = targetId;
  } else {
    const u = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!u) return notFound("Account not found");
    data.reportedUserId = targetId;
  }

  await prisma.report.create({ data });
  return ok({ ok: true });
});
