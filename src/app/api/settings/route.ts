import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { settingsSchema, firstError } from "@/lib/validators";
import { acceptAllPendingRequests } from "@/lib/social";

export const dynamic = "force-dynamic";

// Current preference values for the Settings screen.
export const GET = route(async () => {
  const me = await requireUser();
  return ok({
    settings: {
      email: me.email,
      username: me.username,
      isPrivate: me.isPrivate,
      showActivity: me.showActivity,
      allowComments: me.allowComments,
      allowMentions: me.allowMentions,
      allowTags: me.allowTags,
      notifyLikes: me.notifyLikes,
      notifyComments: me.notifyComments,
      notifyFollowers: me.notifyFollowers,
      notifyMessages: me.notifyMessages,
      twoFactorEnabled: me.twoFactorEnabled,
      theme: me.theme,
      emailVerified: me.emailVerified,
    },
  });
});

// Update preference toggles (privacy, notifications, appearance, 2FA flag).
export const PATCH = route(async (req: NextRequest) => {
  const me = await requireUser();
  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const data = parsed.data;

  // Email change needs a uniqueness check + resets verification.
  if (data.email && data.email !== me.email) {
    const taken = await prisma.user.findUnique({ where: { email: data.email } });
    if (taken) return bad("That email is already in use.");
    (data as any).emailVerified = false;
  }

  const updated = await prisma.user.update({ where: { id: me.id }, data: { ...data } });
  // Switching to public here (as on the profile route) auto-accepts pending requests.
  if (data.isPrivate === false) await acceptAllPendingRequests(me.id);
  return ok({ ok: true, theme: updated.theme });
});

// Change password (requires current password).
export const PUT = route(async (req: NextRequest) => {
  const me = await requireUser();
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 8) return bad("New password must be at least 8 characters.");
  const valid = await verifyPassword(String(current || ""), me.passwordHash);
  if (!valid) return bad("Current password is incorrect.");
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(String(next)) } });
  return ok({ ok: true });
});
