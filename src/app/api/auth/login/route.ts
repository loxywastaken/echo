import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { loginSchema, firstError } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { publicUser } from "@/lib/serialize";

export const POST = route(async (req: NextRequest) => {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const { identifier, password, rememberMe } = parsed.data;

  const id = identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id }, { username: id }] },
  });
  if (!user) return bad("No account found with those details.", 401);
  if (user.status === "banned") return bad("This account has been banned.", 403);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return bad("Incorrect password. Try again.", 401);

  await createSession(user.id, !!rememberMe, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0] || undefined,
  });
  return ok({ user: publicUser(user), suspended: user.status === "suspended" });
});
