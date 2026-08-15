import { NextRequest } from "next/server";
import { route, ok, bad } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { editProfileSchema, firstError } from "@/lib/validators";
import { acceptAllPendingRequests } from "@/lib/social";

export const PATCH = route(async (req: NextRequest) => {
  const me = await requireUser();
  const parsed = editProfileSchema.safeParse(await req.json());
  if (!parsed.success) return bad(firstError(parsed.error));
  const d = parsed.data;

  // Username change → uniqueness check.
  if (d.username && d.username.toLowerCase() !== me.username) {
    const taken = await prisma.user.findUnique({ where: { username: d.username.toLowerCase() } });
    if (taken) return bad("That username is taken.");
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      displayName: d.displayName ?? undefined,
      username: d.username ? d.username.toLowerCase() : undefined,
      bio: d.bio ?? undefined,
      website: d.website ?? undefined,
      location: d.location ?? undefined,
      avatar: d.avatar ?? undefined,
      cover: d.cover ?? undefined,
      isPrivate: d.isPrivate ?? undefined,
    },
  });

  // If switching to public, auto-accept any pending follow requests.
  if (d.isPrivate === false) await acceptAllPendingRequests(me.id);

  return ok({
    user: {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      avatar: updated.avatar,
      cover: updated.cover,
      bio: updated.bio,
      website: updated.website,
      location: updated.location,
      isPrivate: updated.isPrivate,
    },
  });
});
