import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  ACCOUNTS_COOKIE,
  SESSION_TTL_DAYS,
  SESSION_TTL_DAYS_REMEMBER,
  USER_STATUS,
} from "./constants";

// ââ Passwords ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ââ Tokens âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ââ Multi-account cookie helpers âââââââââââââââââââââââââââââââââââââââââââââ
type StoredAccount = { userId: string; token: string };

function getAccountsCookie(): StoredAccount[] {
  try {
    const raw = cookies().get(ACCOUNTS_COOKIE)?.value;
    if (!raw) return [];
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

function setAccountsCookie(accounts: StoredAccount[], expires: Date) {
  cookies().set(ACCOUNTS_COOKIE, JSON.stringify(accounts), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

// ââ Sessions (opaque token stored hashed server-side) âââââââââââââââââââââââââ
export type DeviceInfo = { userAgent?: string; ip?: string };

function labelDevice(ua?: string): string {
  if (!ua) return "Unknown device";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
    ? "Chrome"
    : /Firefox/.test(ua)
    ? "Firefox"
    : /Safari/.test(ua)
    ? "Safari"
    : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS/.test(ua)
    ? "macOS"
    : /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iOS/.test(ua)
    ? "iOS"
    : /Linux/.test(ua)
    ? "Linux"
    : "device";
  return `${browser} on ${os}`;
}

export async function createSession(userId: string, rememberMe: boolean, device: DeviceInfo) {
  const token = randomToken();
  const days = rememberMe ? SESSION_TTL_DAYS_REMEMBER : SESSION_TTL_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      userAgent: device.userAgent,
      ip: device.ip,
      device: labelDevice(device.userAgent),
      rememberMe,
      expiresAt,
    },
  });

  // Set the active session cookie
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  // Add to multi-account cookie (replace if same user already stored)
  const accounts = getAccountsCookie().filter((a) => a.userId !== userId);
  accounts.push({ userId, token });
  setAccountsCookie(accounts, expiresAt);

  return token;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  // Remove only this account from the stored list
  const accounts = getAccountsCookie();
  const remaining = accounts.filter((a) => a.token !== token);

  if (remaining.length > 0) {
    // Switch to the first remaining account
    const next = remaining[0];
    const futureExpiry = new Date(Date.now() + SESSION_TTL_DAYS_REMEMBER * 24 * 60 * 60 * 1000);
    cookies().set(SESSION_COOKIE, next.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: futureExpiry,
    });
    setAccountsCookie(remaining, futureExpiry);
  } else {
    cookies().delete(SESSION_COOKIE);
    cookies().delete(ACCOUNTS_COOKIE);
  }
}

/** Resolve the currently authenticated user, or null. Also refreshes lastActive. */
export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.status === USER_STATUS.BANNED) return null;
  // best-effort activity refresh (don't block the request on it)
  prisma.session
    .update({ where: { id: session.id }, data: { lastActive: new Date() } })
    .catch(() => {});
  return session.user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  return user;
}

export class AuthError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "AuthError";
  }
}

// ââ Multi-account: get linked accounts âââââââââââââââââââââââââââââââââââââââ

/** Returns minimal info for all stored accounts (for the switcher dropdown). */
export async function getLinkedAccounts() {
  const accounts = getAccountsCookie();
  if (accounts.length <= 1) return [];

  const activeToken = cookies().get(SESSION_COOKIE)?.value;

  // Validate each stored session and fetch user info
  const results = await Promise.all(
    accounts.map(async (acct) => {
      const session = await prisma.session.findUnique({
        where: { tokenHash: sha256(acct.token) },
        include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isVerified: true, badgeType: true } } },
      });
      if (!session || session.expiresAt < new Date()) return null;
      if (session.user) {
        return {
          userId: session.user.id,
          username: session.user.username,
          displayName: session.user.displayName,
          avatar: session.user.avatar,
          isVerified: session.user.isVerified,
          badgeType: (session.user as any).badgeType ?? "blue",
          isActive: acct.token === activeToken,
        };
      }
      return null;
    })
  );
  return results.filter(Boolean);
}

/** Switch to a different stored account by userId. Returns true on success. */
export async function switchAccount(targetUserId: string) {
  const accounts = getAccountsCookie();
  const target = accounts.find((a) => a.userId === targetUserId);
  if (!target) return false;

  // Verify the session is still valid
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(target.token) },
  });
  if (!session || session.expiresAt < new Date()) {
    // Remove invalid account from the list
    const cleaned = accounts.filter((a) => a.userId !== targetUserId);
    const futureExpiry = new Date(Date.now() + SESSION_TTL_DAYS_REMEMBER * 24 * 60 * 60 * 1000);
    setAccountsCookie(cleaned, futureExpiry);
    return false;
  }

  // Set the active session cookie to the target account's token
  cookies().set(SESSION_COOKIE, target.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return true;
}

/** Full "me" DTO (profile + counts) used to hydrate the client on first paint. */
export async function getMe() {
  const user = await getSessionUser();
  if (!user) return null;
  const [posts, followers, following, unreadNotifs] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id, status: "published" } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.notification.count({ where: { recipientId: user.id, read: false } }),
  ]);
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    cover: user.cover,
    bio: user.bio,
    website: user.website,
    location: user.location,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    badgeType: (user.badgeType ?? "blue") as "blue" | "gold" | "gray",
    isPrivate: user.isPrivate,
    emailVerified: user.emailVerified,
    theme: user.theme as "dark" | "light" | "system",
    counts: { posts, followers, following },
    unreadNotifs,
  };
}
