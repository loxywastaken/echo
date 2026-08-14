import { NextRequest } from "next/server";
import { route, ok, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setTyping } from "@/lib/presence";

type Ctx = { params: { id: string } };

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: params.id, userId: me.id } },
    select: { id: true },
  });
  if (!member) return forbidden();
  setTyping(params.id, me.id);
  return ok({ ok: true });
});
