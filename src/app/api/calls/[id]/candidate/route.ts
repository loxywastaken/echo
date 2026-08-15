import { NextRequest } from "next/server";
import { route, ok, bad, forbidden, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// Trickle an ICE candidate for the other party to poll.
export const POST = route(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const { candidate } = await req.json().catch(() => ({}));
  if (!candidate) return bad("Missing candidate.");
  const call = await prisma.call.findUnique({
    where: { id: params.id },
    select: { id: true, callerId: true, calleeId: true, status: true },
  });
  if (!call) return notFound("Call not found");
  if (call.callerId !== me.id && call.calleeId !== me.id) return forbidden();
  await prisma.iceCandidate.create({
    data: { callId: call.id, fromId: me.id, candidate: JSON.stringify(candidate) },
  });
  return ok({ ok: true });
});
