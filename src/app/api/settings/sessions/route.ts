import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { route, ok } from "@/lib/api";
import { requireUser, sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Active sessions + login history for the Security screen.
export const GET = route(async () => {
  const me = await requireUser();
  const currentHash = sha256(cookies().get(SESSION_COOKIE)?.value ?? "");
  const sessions = await prisma.session.findMany({
    where: { userId: me.id },
    orderBy: { lastActive: "desc" },
  });
  return ok({
    sessions: sessions.map((s) => ({
      id: s.id,
      device: s.device,
      ip: s.ip,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
      current: s.tokenHash === currentHash,
    })),
  });
});

// Revoke a session (?id=...) or all others (?all=1).
export const DELETE = route(async (req: NextRequest) => {
  const me = await requireUser();
  const { searchParams } = new URL(req.url);
  const currentHash = sha256(cookies().get(SESSION_COOKIE)?.value ?? "");
  if (searchParams.get("all")) {
    await prisma.session.deleteMany({ where: { userId: me.id, tokenHash: { not: currentHash } } });
  } else {
    const id = searchParams.get("id");
    if (id) await prisma.session.deleteMany({ where: { id, userId: me.id } });
  }
  return ok({ ok: true });
});
