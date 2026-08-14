import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Stable placeholder media (loads when the machine is online). Real user
// uploads are saved to /public/uploads instead.
const img = (seed: string, w = 1080, h = 1350) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const avatar = (n: number) => `https://i.pravatar.cc/300?img=${n}`;
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("🌱 Seeding Echo…");

  // Wipe (FK-safe order)
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.messageReaction.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversationMember.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.storyReaction.deleteMany(),
    prisma.storyView.deleteMany(),
    prisma.story.deleteMany(),
    prisma.report.deleteMany(),
    prisma.commentLike.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.savedPost.deleteMany(),
    prisma.postHashtag.deleteMany(),
    prisma.postTag.deleteMany(),
    prisma.hashtag.deleteMany(),
    prisma.media.deleteMany(),
    prisma.post.deleteMany(),
    prisma.followRequest.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.block.deleteMany(),
    prisma.mute.deleteMany(),
    prisma.restrict.deleteMany(),
    prisma.token.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = bcrypt.hashSync("password123", 10);

  const people = [
    { username: "admin", displayName: "Echo Team", role: "admin", isVerified: true, bio: "Keeping Echo a place worth coming back to.", avatarN: 12 },
    { username: "maya", displayName: "Maya Chen", isVerified: true, bio: "Photographer · chasing soft light 🌅\nLondon", avatarN: 5, website: "https://maya.example" },
    { username: "leo", displayName: "Leo Alvarez", bio: "Coffee, code & city walks ☕️", avatarN: 13 },
    { username: "aisha", displayName: "Aisha Khan", isVerified: true, bio: "Designing calm interfaces. Plant hoarder 🪴", avatarN: 45 },
    { username: "noah", displayName: "Noah Bennett", bio: "Trail runner. Mountains > everything ⛰️", avatarN: 15 },
    { username: "sofia", displayName: "Sofia Rossi", bio: "Food I cooked and mostly ate 🍝", avatarN: 20 },
    { username: "kai", displayName: "Kai Tanaka", bio: "Analog film + neon nights 🎞️", avatarN: 33 },
    { username: "ines", displayName: "Inès Dubois", isPrivate: true, bio: "Private garden 🌷 ask to follow", avatarN: 47 },
    { username: "theo", displayName: "Theo Nakamura", bio: "Making tiny games and big playlists 🎮", avatarN: 51 },
    { username: "amara", displayName: "Amara Okafor", isVerified: true, bio: "Travel in 24 frames a second ✈️", avatarN: 32 },
  ];

  const users: Record<string, any> = {};
  for (const p of people) {
    users[p.username] = await prisma.user.create({
      data: {
        email: `${p.username}@echo.app`,
        username: p.username,
        displayName: p.displayName,
        passwordHash,
        role: (p as any).role || "user",
        isVerified: !!(p as any).isVerified,
        isPrivate: !!(p as any).isPrivate,
        emailVerified: true,
        bio: p.bio,
        website: (p as any).website,
        avatar: avatar(p.avatarN),
        location: pick(["London", "Lisbon", "Tokyo", "Berlin", "Nairobi", "New York"]),
      },
    });
  }
  const U = (n: string) => users[n];

  // ── Follow graph ───────────────────────────────────────────────────────────
  const names = people.map((p) => p.username);
  async function follow(a: string, b: string) {
    if (a === b) return;
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: U(a).id, followingId: U(b).id } },
      create: { followerId: U(a).id, followingId: U(b).id },
      update: {},
    });
  }
  // everyone follows maya, aisha, amara; maya follows lots
  for (const n of names) {
    await follow(n, "maya");
    await follow(n, "aisha");
    await follow(n, "amara");
  }
  for (const n of ["leo", "aisha", "noah", "sofia", "kai", "theo", "amara"]) await follow("maya", n);
  await follow("leo", "sofia");
  await follow("noah", "kai");
  await follow("sofia", "leo");

  // Follow request to the private account (ines)
  await prisma.followRequest.create({ data: { fromId: U("maya").id, toId: U("ines").id } });

  // ── Posts ──────────────────────────────────────────────────────────────────
  const hashtagCache: Record<string, any> = {};
  async function tag(t: string) {
    if (!hashtagCache[t]) hashtagCache[t] = await prisma.hashtag.upsert({ where: { tag: t }, create: { tag: t }, update: {} });
    return hashtagCache[t];
  }

  type PostSpec = {
    author: string;
    caption: string;
    location?: string;
    imgs?: { seed: string; w?: number; h?: number }[];
    video?: string;
    isClip?: boolean;
    audioName?: string;
    hashtags?: string[];
    createdDaysAgo?: number;
  };

  const posts: PostSpec[] = [
    { author: "maya", caption: "golden hour never misses ✨ shot this on the way home #goldenhour #london", location: "Primrose Hill, London", imgs: [{ seed: "echo-a1" }, { seed: "echo-a2" }, { seed: "echo-a3" }], hashtags: ["goldenhour", "london"], createdDaysAgo: 0 },
    { author: "aisha", caption: "new plant, who dis 🪴 desk refresh complete #plants #workspace", location: "Lisbon", imgs: [{ seed: "echo-b1", w: 1080, h: 1080 }], hashtags: ["plants", "workspace"], createdDaysAgo: 0 },
    { author: "leo", caption: "third coffee and the code finally compiled ☕️ #devlife", imgs: [{ seed: "echo-c1", w: 1080, h: 720 }], hashtags: ["devlife"], createdDaysAgo: 1 },
    { author: "noah", caption: "5am on the ridge. worth every step ⛰️ #trailrunning #sunrise", location: "Snowdonia", imgs: [{ seed: "echo-d1" }, { seed: "echo-d2" }], hashtags: ["trailrunning", "sunrise"], createdDaysAgo: 1 },
    { author: "sofia", caption: "handmade tagliatelle, second attempt 🍝 getting there #pasta #homecooking", location: "Bologna", imgs: [{ seed: "echo-e1", w: 1080, h: 1080 }], hashtags: ["pasta", "homecooking"], createdDaysAgo: 2 },
    { author: "kai", caption: "neon & rain, my favourite combo 🎞️ #film #tokyo #night", location: "Shibuya, Tokyo", imgs: [{ seed: "echo-f1" }, { seed: "echo-f2" }, { seed: "echo-f3" }, { seed: "echo-f4" }], hashtags: ["film", "tokyo", "night"], createdDaysAgo: 2 },
    { author: "amara", caption: "the bluest water I have ever seen ✈️ #travel #ocean", location: "Zanzibar", imgs: [{ seed: "echo-g1" }, { seed: "echo-g2" }], hashtags: ["travel", "ocean"], createdDaysAgo: 3 },
    { author: "maya", caption: "portrait practice with the softest window light 📷 #portrait", imgs: [{ seed: "echo-h1" }], hashtags: ["portrait"], createdDaysAgo: 3 },
    { author: "theo", caption: "prototyping a tiny pixel world today 🎮 #gamedev #pixelart", imgs: [{ seed: "echo-i1", w: 1080, h: 1080 }], hashtags: ["gamedev", "pixelart"], createdDaysAgo: 4 },
    { author: "aisha", caption: "calm palettes for a calm mind. new case study soon #design #ui", imgs: [{ seed: "echo-j1", w: 1080, h: 720 }], hashtags: ["design", "ui"], createdDaysAgo: 4 },
    { author: "amara", caption: "market mornings hit different 🍊 #travel #market", location: "Marrakech", imgs: [{ seed: "echo-k1" }, { seed: "echo-k2" }], hashtags: ["travel", "market"], createdDaysAgo: 5 },
    { author: "leo", caption: "sunday reset: books, plants, silence 📚", imgs: [{ seed: "echo-l1", w: 1080, h: 1080 }], hashtags: [], createdDaysAgo: 5 },
  ];

  const clips: PostSpec[] = [
    { author: "amara", caption: "60 seconds over the dunes 🏜️ #travel #clips", video: SAMPLE_VIDEOS[0], isClip: true, audioName: "desert wind — original audio", hashtags: ["travel", "clips"], createdDaysAgo: 0 },
    { author: "kai", caption: "city lights in motion 🌃 #tokyo #night", video: SAMPLE_VIDEOS[1], isClip: true, audioName: "midnight synth", hashtags: ["tokyo", "night"], createdDaysAgo: 1 },
    { author: "noah", caption: "downhill flow 🏃‍♂️ #trailrunning", video: SAMPLE_VIDEOS[2], isClip: true, audioName: "original audio — noah", hashtags: ["trailrunning"], createdDaysAgo: 2 },
    { author: "sofia", caption: "how I fold the dough 🍝 #homecooking", video: SAMPLE_VIDEOS[3], isClip: true, audioName: "kitchen sounds", hashtags: ["homecooking"], createdDaysAgo: 3 },
  ];

  const allSpecs = [...posts, ...clips];
  const createdPosts: any[] = [];
  for (const spec of allSpecs) {
    const created = new Date(Date.now() - (spec.createdDaysAgo ?? 0) * 86400000 - Math.floor(Math.random() * 3600_000));
    const post = await prisma.post.create({
      data: {
        authorId: U(spec.author).id,
        caption: spec.caption,
        location: spec.location,
        isClip: !!spec.isClip,
        audioName: spec.audioName,
        createdAt: created,
        media: spec.video
          ? { create: [{ url: spec.video, type: "video", width: 720, height: 1280, position: 0 }] }
          : { create: (spec.imgs || []).map((im, i) => ({ url: img(im.seed, im.w, im.h), type: "image", width: im.w ?? 1080, height: im.h ?? 1350, position: i })) },
      },
    });
    for (const t of spec.hashtags || []) {
      const h = await tag(t);
      await prisma.postHashtag.create({ data: { postId: post.id, hashtagId: h.id } }).catch(() => {});
    }
    createdPosts.push(post);
  }

  // ── Likes, comments, saves ───────────────────────────────────────────────────
  const commentBank = [
    "this is stunning 😍", "obsessed with this", "the colours!! 🔥", "how did you shoot this?",
    "saving this for inspo", "unreal 👏", "need to visit", "perfect composition", "10/10 🙌", "the vibe is immaculate",
  ];
  for (const post of createdPosts) {
    // likes
    for (const n of names) {
      if (n !== people.find((p) => U(p.username).id === post.authorId)?.username && Math.random() > 0.35) {
        await prisma.like.create({ data: { postId: post.id, userId: U(n).id } }).catch(() => {});
      }
    }
    // comments (1–3)
    const c = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < c; i++) {
      const commenter = pick(names);
      if (U(commenter).id === post.authorId) continue;
      const comment = await prisma.comment.create({
        data: { postId: post.id, authorId: U(commenter).id, body: pick(commentBank) },
      });
      if (Math.random() > 0.6) {
        await prisma.comment.create({
          data: { postId: post.id, authorId: post.authorId, parentId: comment.id, body: "thank you! 🙏" },
        });
      }
    }
  }
  // maya saves a couple
  for (const post of createdPosts.filter((p) => p.authorId !== U("maya").id).slice(0, 3)) {
    await prisma.savedPost.create({ data: { postId: post.id, userId: U("maya").id } }).catch(() => {});
  }

  // ── Stories (active) ─────────────────────────────────────────────────────────
  const storyOwners = ["maya", "aisha", "kai", "amara", "noah"];
  for (const n of storyOwners) {
    await prisma.story.create({
      data: { authorId: U(n).id, type: "image", url: img(`story-${n}`, 720, 1280), expiresAt: new Date(Date.now() + 20 * 3600_000) },
    });
  }
  await prisma.story.create({
    data: { authorId: U("maya").id, type: "text", text: "shooting all day — DM me your favourite spots ✨", bgColor: "linear-gradient(135deg,#7c5cff,#22d3ee)", expiresAt: new Date(Date.now() + 22 * 3600_000) },
  });

  // ── Conversations ────────────────────────────────────────────────────────────
  const dm = await prisma.conversation.create({
    data: { isGroup: false, members: { create: [{ userId: U("maya").id }, { userId: U("leo").id }] } },
  });
  const dmMsgs = [
    { from: "leo", body: "hey! loved your golden hour set 🔥" },
    { from: "maya", body: "thank you!! that light was unreal" },
    { from: "leo", body: "we should shoot together next weekend?" },
    { from: "maya", body: "yes please — Primrose Hill at 6am? 🌅" },
  ];
  for (const m of dmMsgs) {
    await prisma.message.create({ data: { conversationId: dm.id, senderId: U(m.from).id, body: m.body } });
  }
  await prisma.conversation.update({ where: { id: dm.id }, data: { updatedAt: new Date() } });

  const group = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: "Weekend Shoot",
      members: { create: [{ userId: U("maya").id, isAdmin: true }, { userId: U("kai").id }, { userId: U("amara").id }] },
    },
  });
  await prisma.message.create({ data: { conversationId: group.id, senderId: U("amara").id, body: "who's in for sunrise on Saturday?" } });
  await prisma.message.create({ data: { conversationId: group.id, senderId: U("kai").id, body: "count me in 🎞️" } });

  // ── Notifications for maya ───────────────────────────────────────────────────
  const mayaPost = createdPosts.find((p) => p.authorId === U("maya").id);
  await prisma.notification.createMany({
    data: [
      { recipientId: U("maya").id, actorId: U("amara").id, type: "follow" },
      { recipientId: U("maya").id, actorId: U("leo").id, type: "like", postId: mayaPost?.id },
      { recipientId: U("maya").id, actorId: U("aisha").id, type: "comment", postId: mayaPost?.id, message: "the colours!!" },
      { recipientId: U("maya").id, actorId: U("kai").id, type: "tag", postId: mayaPost?.id },
    ],
  });

  // ── A sample open report for the admin queue ─────────────────────────────────
  const reportable = createdPosts.find((p) => p.authorId === U("leo").id);
  if (reportable) {
    await prisma.report.create({
      data: { reporterId: U("noah").id, targetType: "post", postId: reportable.id, reason: "Spam", status: "open" },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    posts: await prisma.post.count(),
    comments: await prisma.comment.count(),
    stories: await prisma.story.count(),
  };
  console.log("✅ Seed complete:", counts);
  console.log("→ Log in with  maya / password123   (admin: admin / password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
