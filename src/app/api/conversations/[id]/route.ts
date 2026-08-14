import { NextRequest } from "next/server";
import { route, ok, notFound, forbidden } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

const ONLINE_WINDOW_MS = 3 * 60 * 1000;

export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const me = await requireUser();
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } } },
  });
  if (!convo) return notFound("Conversation not found");
  if (!convo.members.some((m) => m.userId === me.id)) return forbidden();

  // Online = has an active session within the window, and shares activity.
  const others = convo.members.filter((m) => m.userId !== me.id);
  const online = await Promise.all(
    others.map(async (m) => {
      if (!m.user.showActivity) return false;
      const s = await prisma.session.findFirst({
        where: { userId: m.userId, lastActive: { gt: new Date(Date.now() - ONLINE_WINDOW_MS) } },
      });
      return !!s;
    })
  );

  return ok({
    conversation: {
      id: convo.id,
      isGroup: convo.isGroup,
      name: convo.name,
      avatar: convo.avatar,
      members: others.map((m, i) => ({ ...publicUser(m.user), online: online[i] })),
    },
  });
});
