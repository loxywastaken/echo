import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { resetSchema, firstError } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { hashPassword, sha256 } from "@/lib/auth";

export const POST = route(async (req: NextRequest) => {
  const parsed = resetSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const { token, password } = parsed.data;

  const record = await prisma.token.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.type !== "reset_password" || record.usedAt || record.expiresAt < new Date()) {
    return bad("This reset link is invalid or has expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.token.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Sign the user out everywhere for safety.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return ok({ ok: true });
});
