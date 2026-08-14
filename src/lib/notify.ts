import "server-only";
import { prisma } from "./db";
import { NOTIF } from "./constants";

type NotifInput = {
  recipientId: string;
  actorId?: string;
  type: (typeof NOTIF)[keyof typeof NOTIF];
  postId?: string;
  commentId?: string;
  message?: string;
};

// Maps a notification type to the recipient's opt-out preference.
const prefKey: Record<string, keyof PrefShape | undefined> = {
  [NOTIF.LIKE]: "notifyLikes",
  [NOTIF.COMMENT]: "notifyComments",
  [NOTIF.REPLY]: "notifyComments",
  [NOTIF.FOLLOW]: "notifyFollowers",
  [NOTIF.FOLLOW_REQUEST]: "notifyFollowers",
  [NOTIF.MESSAGE]: "notifyMessages",
};
type PrefShape = {
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollowers: boolean;
  notifyMessages: boolean;
};

export async function notify(input: NotifInput) {
  // Never notify yourself about your own action.
  if (input.actorId && input.actorId === input.recipientId) return;

  const key = prefKey[input.type];
  if (key) {
    const r = await prisma.user.findUnique({
      where: { id: input.recipientId },
      select: { [key]: true } as any,
    });
    if (r && (r as any)[key] === false) return; // recipient opted out
  }

  await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId,
      commentId: input.commentId,
      message: input.message,
    },
  });
}

/** Fan a mention/tag notification out to a set of usernames. */
export async function notifyUsernames(
  usernames: string[],
  base: Omit<NotifInput, "recipientId">
) {
  if (usernames.length === 0) return;
  const users = await prisma.user.findMany({
    where: { username: { in: usernames.map((u) => u.toLowerCase()) } },
    select: { id: true },
  });
  await Promise.all(users.map((u) => notify({ ...base, recipientId: u.id })));
}
