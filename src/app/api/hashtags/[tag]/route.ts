import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postInclude, serializePost } from "@/lib/serialize";
import { invisibleUserIds } from "@/lib/social";

export const dynamic = "force-dynamic";

type Ctx = { params: { tag: string } };

export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const viewer = await getSessionUser();
  const tag = decodeURIComponent(params.tag).toLowerCase().replace(/^#/, "");
  const hidden = viewer ? await invisibleUserIds(viewer.id) : [];

  const hashtag = await prisma.hashtag.findUnique({
    where: { tag },
    include: { _count: { select: { posts: true } } },
  });
  if (!hashtag) return ok({ tag, count: 0, posts: [] });

  const links = await prisma.postHashtag.findMany({
    where: { hashtagId: hashtag.id, post: { status: "published", authorId: { notIn: hidden } } },
    include: { post: { include: postInclude(viewer?.id) } },
    orderBy: { post: { createdAt: "desc" } },
    take: 30,
  });

  return ok({
    tag,
    count: hashtag._count.posts,
    posts: links.map((l) => serializePost(l.post, viewer?.id)),
  });
});
