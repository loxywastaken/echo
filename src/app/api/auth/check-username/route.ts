import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { usernameSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const username = (new URL(req.url).searchParams.get("username") || "").trim();
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return ok({ available: false, valid: false, message: parsed.error.issues[0]?.message });
  }
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  return ok({
    available: !existing,
    valid: true,
    message: existing ? "Username is taken" : "Username is available",
  });
});
