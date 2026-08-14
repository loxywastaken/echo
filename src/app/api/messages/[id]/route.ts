import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

// Unsend: soft-delete so the bubble becomes "message deleted".
export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message) return notFound("Message not found");
  if (message.senderId !== me.id) return forbidden();
  await prisma.message.update({
    where: { id: params.id },
    data: { deleted: true, body: null, mediaUrl: null },
  });
  return ok({ ok: true });
});
