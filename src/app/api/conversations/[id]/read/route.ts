import { NextRequest } from "next/server";
import { route, ok, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: params.id, userId: me.id } },
  });
  if (!member) return forbidden();
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.id, userId: me.id } },
    data: { lastReadAt: new Date() },
  });
  return ok({ ok: true });
});
