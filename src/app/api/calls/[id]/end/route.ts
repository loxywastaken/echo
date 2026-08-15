import { NextRequest } from "next/server";
import { route, ok, forbidden, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// End or decline a call. Declining = the callee hanging up while still ringing.
export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const call = await prisma.call.findUnique({ where: { id: params.id } });
  if (!call) return notFound("Call not found");
  if (call.callerId !== me.id && call.calleeId !== me.id) return forbidden();
  if (call.status === "ended" || call.status === "declined") return ok({ ok: true });
  const declined = call.status === "ringing" && call.calleeId === me.id;
  await prisma.call.update({
    where: { id: call.id },
    data: { status: declined ? "declined" : "ended", endedAt: new Date() },
  });
  return ok({ ok: true });
});
