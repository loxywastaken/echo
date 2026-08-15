import { NextRequest } from "next/server";
import { route, ok, bad, forbidden, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// Callee accepts: store the SDP answer and flip the call to active.
export const POST = route(async (req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const { answer } = await req.json().catch(() => ({}));
  if (!answer) return bad("Missing answer.");
  const call = await prisma.call.findUnique({ where: { id: params.id } });
  if (!call) return notFound("Call not found");
  if (call.calleeId !== me.id) return forbidden();
  if (call.status !== "ringing") return bad("This call is no longer ringing.");
  await prisma.call.update({
    where: { id: call.id },
    data: { answer: JSON.stringify(answer), status: "active", answeredAt: new Date() },
  });
  return ok({ ok: true });
});
