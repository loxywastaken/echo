import { NextRequest } from "next/server";
import { route, ok, bad, notFound } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: { username: string } };
const target = (u: string) => prisma.user.findUnique({ where: { username: u.toLowerCase() } });

export const POST = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const t = await target(params.username);
  if (!t) return notFound("Account not found");
  if (t.id === me.id) return bad("You can't restrict yourself.");
  await prisma.restrict.upsert({
    where: { restricterId_restrictedId: { restricterId: me.id, restrictedId: t.id } },
    create: { restricterId: me.id, restrictedId: t.id },
    update: {},
  });
  return ok({ restricted: true });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const t = await target(params.username);
  if (!t) return notFound("Account not found");
  await prisma.restrict.deleteMany({ where: { restricterId: me.id, restrictedId: t.id } });
  return ok({ restricted: false });
});
