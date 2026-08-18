import { route, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return ok({ user: null });

  const [posts, followers, following, unreadNotifs] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id, status: "published" } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.notification.count({ where: { recipientId: user.id, read: false } }),
  ]);

  return ok({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      website: user.website,
      location: user.location,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      badgeType: user.badgeType ?? "blue",
      isPrivate: user.isPrivate,
      emailVerified: user.emailVerified,
      theme: user.theme,
      counts: { posts, followers, following },
      unreadNotifs,
    },
  });
});
