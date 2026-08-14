import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postInclude, serializePost } from "@/lib/serialize";
import { canViewContent } from "@/lib/social";

export const dynamic = "force-dynamic";
type Ctx = { params: { username: string } };

// tab: posts | clips | tagged | saved (saved only for self)
export const GET = route(async (req: NextRequest, { params }: Ctx) => {
  const viewer = await getSessionUser();
  const tab = new URL(req.url).searchParams.get("tab") || "posts";
  const user = await prisma.user.findUnique({ where: { username: params.username.toLowerCase() } });
  if (!user) return notFound("Account not found");

  const isSelf = viewer?.id === user.id;
  if (!isSelf && !(await canViewContent(viewer?.id ?? null, user))) return forbidden();

  let posts: any[] = [];
  if (tab === "saved") {
    if (!isSelf) return forbidden();
    const saves = await prisma.savedPost.findMany({
      where: { userId: user.id },
      include: { post: { include: postInclude(viewer?.id) } },
      orderBy: { createdAt: "desc" },
    });
    posts = saves.map((s) => s.post).filter((p) => p.status === "published");
  } else if (tab === "tagged") {
    const tags = await prisma.postTag.findMany({
      where: { userId: user.id, post: { status: "published" } },
      include: { post: { include: postInclude(viewer?.id) } },
      orderBy: { post: { createdAt: "desc" } },
    });
    posts = tags.map((t) => t.post);
  } else {
    posts = await prisma.post.findMany({
      where: { authorId: user.id, status: "published", isClip: tab === "clips" },
      include: postInclude(viewer?.id),
      orderBy: { createdAt: "desc" },
    });
  }

  return ok({ posts: posts.map((p) => serializePost(p, viewer?.id)) });
});
