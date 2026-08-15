import { NextRequest } from "next/server";
import { route, ok, bad, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isBlockedBetween } from "@/lib/social";

export const dynamic = "force-dynamic";

// Start a 1:1 call: the caller posts its SDP offer and we create a ringing Call.
export const POST = route(async (req: NextRequest) => {
  const me = await requireUser();
  const { calleeId, kind, offer } = await req.json().catch(() => ({}));
  if (!calleeId || !offer) return bad("Missing call details.");
  if (calleeId === me.id) return bad("You can't call yourself.");

  const callee = await prisma.user.findUnique({
    where: { id: calleeId },
    select: { id: true, status: true },
  });
  if (!callee || callee.status === "banned") return bad("This person is unavailable.");
  if (await isBlockedBetween(me.id, calleeId)) return forbidden();

  // Clear any stale outgoing rings from me so the callee only sees the latest.
  await prisma.call.updateMany({
    where: { callerId: me.id, status: "ringing" },
    data: { status: "ended", endedAt: new Date() },
  });

  const call = await prisma.call.create({
    data: {
      callerId: me.id,
      calleeId,
      kind: kind === "audio" ? "audio" : "video",
      offer: JSON.stringify(offer),
      status: "ringing",
    },
  });
  return ok({ call: { id: call.id, status: call.status, kind: call.kind } });
});
