import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { forgotSchema, firstError } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/auth";

export const POST = route(async (req: NextRequest) => {
  const parsed = forgotSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  let devLink: string | undefined;

  // Always respond success to avoid leaking which emails are registered.
  if (user) {
    const token = randomToken();
    await prisma.token.create({
      data: {
        userId: user.id,
        type: "reset_password",
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
      },
    });
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    if (process.env.DEV_EMAIL_TO_CONSOLE === "true") {
      console.log(`\n[echo] Password reset for ${user.email}:\n${link}\n`);
      devLink = link;
    }
  }
  return ok({ ok: true, devLink });
});
