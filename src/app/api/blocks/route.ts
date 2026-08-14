import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Blocked / muted / restricted lists for the Settings screen.
export const GET = route(async () => {
  const me = await requireUser();
  const [blocks, mutes, restricts] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: me.id }, include: { blocked: true } }),
    prisma.mute.findMany({ where: { muterId: me.id }, include: { muted: true } }),
    prisma.restrict.findMany({ where: { restricterId: me.id }, include: { restricted: true } }),
  ]);
  return ok({
    blocked: blocks.map((b) => publicUser(b.blocked)),
    muted: mutes.map((m) => publicUser(m.muted)),
    restricted: restricts.map((r) => publicUser(r.restricted)),
  });
});
