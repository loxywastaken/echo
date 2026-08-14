import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  if (me.role !== "admin") return forbidden();
  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return notFound("Comment not found");
  await prisma.comment.delete({ where: { id: params.id } });
  await prisma.report.updateMany({ where: { commentId: params.id, status: { in: ["open", "reviewing"] } }, data: { status: "resolved" } });
  return ok({ ok: true });
});
