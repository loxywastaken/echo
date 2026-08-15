// Shape Prisma records into stable, client-safe DTOs and centralise the
// `include` clauses so every route returns posts/users in the same shape.
// Inputs are typed loosely because they carry viewer-scoped includes.

export function postInclude(viewerId?: string) {
  return {
    author: true,
    media: { orderBy: { position: "asc" as const } },
    tags: { include: { user: true } },
    hashtags: { include: { hashtag: true } },
    _count: { select: { likes: true, comments: true, saves: true } },
    likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : undefined,
    saves: viewerId ? { where: { userId: viewerId }, select: { id: true } } : undefined,
  };
}

export function publicUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar ?? null,
    isVerified: !!u.isVerified,
    isPrivate: !!u.isPrivate,
    bio: u.bio ?? null,
  };
}

export function serializePost(post: any, viewerId?: string) {
  return {
    id: post.id,
    caption: post.caption ?? "",
    location: post.location ?? null,
    status: post.status,
    commentsDisabled: !!post.commentsDisabled,
    isClip: !!post.isClip,
    audioName: post.audioName ?? null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: publicUser(post.author),
    media: (post.media ?? []).map((m: any) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      width: m.width ?? null,
      height: m.height ?? null,
      duration: m.duration ?? null,
      altText: m.altText ?? null,
    })),
    taggedUsers: (post.tags ?? []).map((t: any) => publicUser(t.user)),
    hashtags: (post.hashtags ?? []).map((h: any) => h.hashtag?.tag).filter(Boolean),
    likeCount: post._count?.likes ?? 0,
    commentCount: post._count?.comments ?? 0,
    saveCount: post._count?.saves ?? 0,
    likedByMe: Array.isArray(post.likes) ? post.likes.length > 0 : false,
    savedByMe: Array.isArray(post.saves) ? post.saves.length > 0 : false,
    isMine: viewerId ? post.authorId === viewerId : false,
  };
}
export type SerializedPost = ReturnType<typeof serializePost>;

export function serializeComment(c: any, viewerId?: string) {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    parentId: c.parentId ?? null,
    author: publicUser(c.author),
    likeCount: c._count?.likes ?? 0,
    replyCount: c._count?.replies ?? 0,
    likedByMe: Array.isArray(c.likes) ? c.likes.length > 0 : false,
    isMine: viewerId ? c.authorId === viewerId : false,
  };
}

export function serializeStory(s: any, viewerId?: string) {
  return {
    id: s.id,
    type: s.type,
    url: s.url ?? null,
    text: s.text ?? null,
    bgColor: s.bgColor ?? null,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    author: publicUser(s.author),
    viewCount: s._count?.views ?? 0,
    seenByMe: Array.isArray(s.views) ? s.views.length > 0 : false,
    isMine: viewerId ? s.authorId === viewerId : false,
  };
}

export function serializeNotification(n: any, opts?: { followsActor?: boolean }) {
  return {
    id: n.id,
    type: n.type,
    read: !!n.read,
    message: n.message ?? null,
    createdAt: n.createdAt,
    actor: publicUser(n.actor),
    post: n.post
      ? { id: n.post.id, thumb: n.post.media?.[0]?.url ?? null }
      : null,
    commentId: n.commentId ?? null,
    // Whether the viewer already follows the actor (drives the follow-back button).
    followsActor: !!opts?.followsActor,
  };
}

export function serializeMessage(m: any, viewerId?: string) {
  return {
    id: m.id,
    body: m.deleted ? null : m.body ?? null,
    mediaUrl: m.deleted ? null : m.mediaUrl ?? null,
    mediaType: m.mediaType ?? null,
    deleted: !!m.deleted,
    createdAt: m.createdAt,
    senderId: m.senderId,
    sender: publicUser(m.sender),
    isMine: viewerId ? m.senderId === viewerId : false,
    replyTo: m.replyTo
      ? { id: m.replyTo.id, body: m.replyTo.body, senderId: m.replyTo.senderId }
      : null,
    reactions: (m.reactions ?? []).map((r: any) => ({
      emoji: r.emoji,
      userId: r.userId,
    })),
  };
}
