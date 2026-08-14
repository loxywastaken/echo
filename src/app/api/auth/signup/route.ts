import { NextRequest } from "next/server";
import { route, ok, bad, created } from "@/lib/api";
import { signupSchema, firstError } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, randomToken, sha256 } from "@/lib/auth";
import { publicUser } from "@/lib/serialize";

function reqDevice(req: NextRequest) {
  return {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0] || undefined,
  };
}

export const POST = route(async (req: NextRequest) => {
  const parsed = signupSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const { email, username, displayName, password } = parsed.data;

  const [emailTaken, userTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username: username.toLowerCase() } }),
  ]);
  if (emailTaken) return bad("That email is already registered.");
  if (userTaken) return bad("That username is taken.");

  const user = await prisma.user.create({
    data: {
      email,
      username: username.toLowerCase(),
      displayName,
      passwordHash: await hashPassword(password),
    },
  });

  // Issue an email-verification token. In dev we print (and return) the link
  // instead of sending an email.
  const token = randomToken();
  await prisma.token.create({
    data: {
      userId: user.id,
      type: "verify_email",
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  const devMode = process.env.DEV_EMAIL_TO_CONSOLE === "true";
  if (devMode) console.log(`\n[echo] Verify email for ${email}:\n${link}\n`);

  await createSession(user.id, false, reqDevice(req));
  return created({ user: publicUser(user), verifyLink: devMode ? link : undefined });
});
