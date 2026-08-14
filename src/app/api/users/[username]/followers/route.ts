import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";
import { canViewContent, isFollowing } from "@/lib/social";

export const dynamic = "force-dynamic";
type Ctx = { params: { username: string } };

export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const viewer = await getSessionUser();
  const user = await prisma.user.findUnique({ where: { username: params.username.toLowerCase() } });
  if (!user) return notFound("Account not found");
  if (!(await canViewContent(viewer?.id ?? null, user))) return forbidden();

  const rows = await prisma.follow.findMany({
    where: { followingId: user.id },
    include: { follower: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const list = await Promise.all(
    rows.map(async (r) => ({
      ...publicUser(r.follower),
      isFollowing: viewer ? await isFollowing(viewer.id, r.follower.id) : false,
      isSelf: viewer?.id === r.follower.id,
    }))
  );
  return ok({ users: list });
});
