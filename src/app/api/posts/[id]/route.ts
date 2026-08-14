import { NextRequest } from "next/server";
import { route, ok, bad, notFound, forbidden } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { editPostSchema, firstError } from "@/lib/validators";
import { postInclude, serializePost } from "@/lib/serialize";
import { canViewContent, invisibleUserIds } from "@/lib/social";

type Ctx = { params: { id: string } };

export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const viewer = await getSessionUser();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { ...postInclude(viewer?.id), author: true },
  });
  if (!post || post.status !== "published") return notFound("Post not found");

  // Privacy + block checks.
  if (viewer) {
    const hidden = await invisibleUserIds(viewer.id);
    if (hidden.includes(post.authorId)) return notFound("Post not found");
  }
  const allowed = await canViewContent(viewer?.id ?? null, post.author);
  if (!allowed) return forbidden();

  return ok({ post: serializePost(post, viewer?.id) });
});

export const PATCH = route(async (req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return notFound("Post not found");
  if (post.authorId !== user.id) return forbidden();

  const parsed = editPostSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      caption: parsed.data.caption ?? post.caption,
      commentsDisabled: parsed.data.commentsDisabled ?? post.commentsDisabled,
    },
    include: postInclude(user.id),
  });
  return ok({ post: serializePost(updated, user.id) });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const user = await requireUser();
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return notFound("Post not found");
  if (post.authorId !== user.id && user.role !== "admin") return forbidden();

  await prisma.post.delete({ where: { id: params.id } });
  return ok({ ok: true });
});
