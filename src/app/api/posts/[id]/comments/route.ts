import { NextRequest } from "next/server";
import { route, ok, bad, notFound, forbidden } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { commentSchema, firstError } from "@/lib/validators";
import { serializeComment } from "@/lib/serialize";
import { extractMentions } from "@/lib/utils";
import { notify, notifyUsernames } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";
import { invisibleUserIds, canViewContent, isFollowing } from "@/lib/social";

type Ctx = { params: { id: string } };

export const dynamic = "force-dynamic";

const commentInclude = (viewerId?: string) => ({
  author: true,
  _count: { select: { likes: true, replies: true } },
  likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : undefined,
});

export const GET = route(async (req: NextRequest, { params }: Ctx) => {
  const viewer = await getSessionUser();

  // Only expose comments on posts the viewer is allowed to see.
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, status: true, author: { select: { id: true, isPrivate: true } } },
  });
  if (!post || post.status !== "published") return notFound("Post not found");
  if (viewer) {
    const hidden = await invisibleUserIds(viewer.id);
    if (hidden.includes(post.authorId)) return notFound("Post not found");
  }
  if (!(await canViewContent(viewer?.id ?? null, post.author))) return forbidden();

  const comments = await prisma.comment.findMany({
    where: { postId: params.id, parentId: null },
    include: {
      ...commentInclude(viewer?.id),
      replies: { include: commentInclude(viewer?.id), orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok({
    comments: comments.map((c: any) => ({
      ...serializeComment(c, viewer?.id),
      replies: (c.replies ?? []).map((r: any) => serializeComment(r, viewer?.id)),
    })),
  });
});

export const POST = route(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      authorId: true,
      status: true,
      commentsDisabled: true,
      author: { select: { id: true, isPrivate: true, allowComments: true } },
    },
  });
  if (!post || post.status !== "published") return notFound("Post not found");
  if (post.commentsDisabled) return forbidden();

  // Block + privacy enforcement.
  const hidden = await invisibleUserIds(user.id);
  if (hidden.includes(post.authorId)) return notFound("Post not found");
  if (!(await canViewContent(user.id, post.author))) return forbidden();

  // Honour the author's "who can comment" preference (everyone | followers | none).
  if (post.authorId !== user.id) {
    const pref = post.author.allowComments;
    if (pref === "none") return forbidden();
    if (pref === "followers" && !(await isFollowing(user.id, post.authorId))) return forbidden();
  }

  const parsed = commentSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const { body, parentId } = parsed.data;

  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: user.id, body, parentId: parentId || null },
    include: commentInclude(user.id),
  });

  // Notify: post author on comment; parent author on reply.
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
    if (parent) await notify({ recipientId: parent.authorId, actorId: user.id, type: NOTIF.REPLY, postId: post.id, commentId: comment.id });
  } else {
    await notify({ recipientId: post.authorId, actorId: user.id, type: NOTIF.COMMENT, postId: post.id, commentId: comment.id });
  }
  await notifyUsernames(
    extractMentions(body),
    { actorId: user.id, type: NOTIF.MENTION, postId: post.id, commentId: comment.id },
    { prefField: "allowMentions" }
  );

  return ok({ comment: serializeComment(comment, user.id) });
});
