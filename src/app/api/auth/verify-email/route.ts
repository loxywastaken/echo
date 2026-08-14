import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/auth";

export const POST = route(async (req: NextRequest) => {
  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") return bad("Missing verification token.");

  const record = await prisma.token.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.type !== "verify_email" || record.usedAt || record.expiresAt < new Date()) {
    return bad("This verification link is invalid or has expired.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.token.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return ok({ ok: true });
});
