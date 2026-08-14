import { NextRequest } from "next/server";
import { route, created, bad } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPostSchema, firstError } from "@/lib/validators";
import { extractHashtags, extractMentions } from "@/lib/utils";
import { postInclude, serializePost } from "@/lib/serialize";
import { notify, notifyUsernames } from "@/lib/notify";
import { NOTIF } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser();
  const parsed = createPostSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const d = parsed.data;

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      caption: d.caption,
      location: d.location,
      commentsDisabled: d.commentsDisabled,
      isClip: d.isClip,
      audioName: d.audioName,
      media: {
        create: d.media.map((m, i) => ({
          url: m.url,
          type: m.type,
          width: m.width,
          height: m.height,
          duration: m.duration,
          altText: m.altText,
          position: i,
        })),
      },
    },
  });

  // Link hashtags.
  for (const tag of extractHashtags(d.caption || "")) {
    const h = await prisma.hashtag.upsert({ where: { tag }, create: { tag }, update: {} });
    await prisma.postHashtag.create({ data: { postId: post.id, hashtagId: h.id } }).catch(() => {});
  }

  // Tag users + notify.
  if (d.taggedUsernames.length) {
    const tagged = await prisma.user.findMany({
      where: { username: { in: d.taggedUsernames.map((u) => u.toLowerCase()) } },
      select: { id: true },
    });
    for (const t of tagged) {
      await prisma.postTag.create({ data: { postId: post.id, userId: t.id } }).catch(() => {});
      await notify({ recipientId: t.id, actorId: user.id, type: NOTIF.TAG, postId: post.id });
    }
  }

  // Mentions in caption.
  await notifyUsernames(extractMentions(d.caption || ""), {
    actorId: user.id,
    type: NOTIF.MENTION,
    postId: post.id,
  });

  const full = await prisma.post.findUnique({
    where: { id: post.id },
    include: postInclude(user.id),
  });
  return created({ post: serializePost(full, user.id) });
});
