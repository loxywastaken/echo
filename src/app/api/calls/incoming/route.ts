import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Poll target: the newest ringing call directed at me (ignoring stale rings).
export const GET = route(async () => {
  const me = await requireUser();
  const cutoff = new Date(Date.now() - 45 * 1000);
  const call = await prisma.call.findFirst({
    where: { calleeId: me.id, status: "ringing", createdAt: { gt: cutoff } },
    orderBy: { createdAt: "desc" },
    include: { caller: true },
  });
  if (!call) return ok({ call: null });
  return ok({
    call: {
      id: call.id,
      kind: call.kind,
      offer: call.offer ? JSON.parse(call.offer) : null,
      caller: publicUser(call.caller),
      createdAt: call.createdAt,
    },
  });
});
