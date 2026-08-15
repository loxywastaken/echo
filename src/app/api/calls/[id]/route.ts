import { NextRequest } from "next/server";
import { route, ok, forbidden, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// Poll target for both parties: current status, the answer (once set), and the
// other party's trickled ICE candidates (client dedupes by id).
export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const call = await prisma.call.findUnique({ where: { id: params.id } });
  if (!call) return notFound("Call not found");
  if (call.callerId !== me.id && call.calleeId !== me.id) return forbidden();

  const candidates = await prisma.iceCandidate.findMany({
    where: { callId: call.id, fromId: { not: me.id } },
    orderBy: { createdAt: "asc" },
    select: { id: true, candidate: true },
  });

  return ok({
    id: call.id,
    status: call.status,
    kind: call.kind,
    callerId: call.callerId,
    calleeId: call.calleeId,
    answer: call.answer ? JSON.parse(call.answer) : null,
    candidates: candidates.map((c) => ({ id: c.id, candidate: JSON.parse(c.candidate) })),
  });
});
