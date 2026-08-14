import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const me = await requireUser();
  const requests = await prisma.followRequest.findMany({
    where: { toId: me.id },
    include: { from: true },
    orderBy: { createdAt: "desc" },
  });
  return ok({
    requests: requests.map((r) => ({ id: r.id, createdAt: r.createdAt, user: publicUser(r.from) })),
  });
});
