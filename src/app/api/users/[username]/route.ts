import { NextRequest } from "next/server";
import { route, ok, notFound } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRelationship, canViewContent } from "@/lib/social";

export const dynamic = "force-dynamic";

type Ctx = { params: { username: string } };

export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const viewer = await getSessionUser();
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    include: { _count: { select: { followers: true, following: true } } },
  });
  if (!user || user.status === "banned") return notFound("Account not found");
  const postCount = await prisma.post.count({ where: { authorId: user.id, status: "published" } });

  const rel = viewer
    ? await getRelationship(viewer.id, user.id)
    : {
        isSelf: false,
        isFollowing: false,
        followsMe: false,
        requested: false,
        isBlocked: false,
        blockedBy: false,
        isMuted: false,
        isRestricted: false,
      };
  const canView = rel.blockedBy ? false : await canViewContent(viewer?.id ?? null, user);

  return ok({
    profile: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      website: user.website,
      location: user.location,
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      status: user.status,
      counts: {
        posts: postCount,
        followers: user._count.followers,
        following: user._count.following,
      },
    },
    relationship: rel,
    canView,
  });
});
