import { NextRequest } from "next/server";
import { route, ok, bad, created } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storySchema, firstError } from "@/lib/validators";
import { serializeStory, publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Story trays for the feed: my own + people I follow, active (< 24h), grouped
// by author with an "unseen" flag to drive the ring styling.
export const GET = route(async () => {
  const me = await requireUser();
  const following = await prisma.follow.findMany({
    where: { followerId: me.id },
    select: { followingId: true },
  });
  const authorIds = [me.id, ...following.map((f) => f.followingId)];

  const stories = await prisma.story.findMany({
    where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
    include: {
      author: true,
      _count: { select: { views: true } },
      views: { where: { viewerId: me.id }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byAuthor = new Map<string, any>();
  for (const s of stories) {
    if (!byAuthor.has(s.authorId)) {
      byAuthor.set(s.authorId, { author: publicUser(s.author), stories: [], hasUnseen: false });
    }
    const tray = byAuthor.get(s.authorId);
    const ser = serializeStory(s, me.id);
    tray.stories.push(ser);
    if (!ser.seenByMe && s.authorId !== me.id) tray.hasUnseen = true;
  }

  const trays = Array.from(byAuthor.values());
  // Self first, then unseen, then the rest.
  trays.sort((a, b) => {
    if (a.author.id === me.id) return -1;
    if (b.author.id === me.id) return 1;
    return Number(b.hasUnseen) - Number(a.hasUnseen);
  });

  return ok({ trays });
});

export const POST = route(async (req: NextRequest) => {
  const me = await requireUser();
  const parsed = storySchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const d = parsed.data;
  if (d.type !== "text" && !d.url) return bad("Story media is required.");

  const story = await prisma.story.create({
    data: {
      authorId: me.id,
      type: d.type,
      url: d.url,
      text: d.text,
      bgColor: d.bgColor,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    include: { author: true, _count: { select: { views: true } } },
  });
  return created({ story: serializeStory(story, me.id) });
});
