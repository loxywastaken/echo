import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  SESSION_TTL_DAYS_REMEMBER,
  USER_STATUS,
} from "./constants";

// ── Passwords ────────────────────────────────────────────────────────────────
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ── Tokens ───────────────────────────────────────────────────────────────────
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ── Sessions (opaque token stored hashed server-side) ─────────────────────────
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
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  cookies().delete(SESSION_COOKIE);
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
  // Env-based admin allowlist (ADMIN_USERNAMES="zxme,other") — grants admin
  // without a DB write, so it works on hosts where we can't run make-admin.
  const admins = (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(session.user.username.toLowerCase())) {
    (session.user as any).role = "admin";
  }
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
    isPrivate: user.isPrivate,
    emailVerified: user.emailVerified,
    theme: user.theme as "dark" | "light" | "system",
    counts: { posts, followers, following },
    unreadNotifs,
  };
}
