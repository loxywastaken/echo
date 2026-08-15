import "server-only";
import { prisma } from "./db";

/** IDs the viewer has blocked OR who have blocked the viewer — filtered out of feeds/search. */
export async function invisibleUserIds(viewerId: string): Promise<string[]> {
  const [blocking, blockedBy] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: viewerId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: viewerId }, select: { blockerId: true } }),
  ]);
  return Array.from(
    new Set([...blocking.map((b) => b.blockedId), ...blockedBy.map((b) => b.blockerId)])
  );
}

export async function isFollowing(followerId: string, followingId: string) {
  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!row;
}

/** True if either user has blocked the other. */
export async function isBlockedBetween(a: string, b: string) {
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return !!row;
}

/**
 * Prisma `Post` where-fragment limiting results to posts the viewer may see:
 * posts by public authors, the viewer's own posts, or posts by accounts the
 * viewer follows. AND it with other conditions (spread it into the `where`).
 */
export async function visiblePostWhere(viewerId: string | null): Promise<any> {
  if (!viewerId) return { author: { isPrivate: false } };
  const following = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  return {
    OR: [
      { author: { isPrivate: false } },
      { authorId: viewerId },
      { authorId: { in: following.map((f) => f.followingId) } },
    ],
  };
}

/** Convert all of a user's pending follow requests into follows (used when going public). */
export async function acceptAllPendingRequests(userId: string) {
  const pending = await prisma.followRequest.findMany({ where: { toId: userId } });
  if (!pending.length) return;
  await prisma.$transaction([
    ...pending.map((r) =>
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: r.fromId, followingId: userId } },
        create: { followerId: r.fromId, followingId: userId },
        update: {},
      })
    ),
    prisma.followRequest.deleteMany({ where: { toId: userId } }),
  ]);
}

export type Relationship = {
  isSelf: boolean;
  isFollowing: boolean;
  followsMe: boolean;
  requested: boolean;
  isBlocked: boolean;
  blockedBy: boolean;
  isMuted: boolean;
  isRestricted: boolean;
};

export async function getRelationship(viewerId: string, targetId: string): Promise<Relationship> {
  if (viewerId === targetId) {
    return {
      isSelf: true,
      isFollowing: false,
      followsMe: false,
      requested: false,
      isBlocked: false,
      blockedBy: false,
      isMuted: false,
      isRestricted: false,
    };
  }
  const [following, followedBy, request, blocking, blockedBy, muting, restricting] =
    await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: targetId, followingId: viewerId } },
      }),
      prisma.followRequest.findUnique({
        where: { fromId_toId: { fromId: viewerId, toId: targetId } },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewerId, blockedId: targetId } },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: targetId, blockedId: viewerId } },
      }),
      prisma.mute.findUnique({
        where: { muterId_mutedId: { muterId: viewerId, mutedId: targetId } },
      }),
      prisma.restrict.findUnique({
        where: { restricterId_restrictedId: { restricterId: viewerId, restrictedId: targetId } },
      }),
    ]);
  return {
    isSelf: false,
    isFollowing: !!following,
    followsMe: !!followedBy,
    requested: !!request,
    isBlocked: !!blocking,
    blockedBy: !!blockedBy,
    isMuted: !!muting,
    isRestricted: !!restricting,
  };
}

/** Can the viewer see the target's posts/followers grid? */
export async function canViewContent(viewerId: string | null, target: { id: string; isPrivate: boolean }) {
  if (!target.isPrivate) return true;
  if (!viewerId) return false;
  if (viewerId === target.id) return true;
  return isFollowing(viewerId, target.id);
}
