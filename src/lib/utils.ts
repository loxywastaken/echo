import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact counts: 1.2k, 3.4m. */
export function formatCount(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

/** Short relative time: "now", "5m", "3h", "2d", "4w", or a date. */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  const w = Math.floor(days / 7);
  if (w < 5) return `${w}w`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Longer time for chat bubbles. */
export function clockTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Extract #hashtags (lowercased, no #). */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#([\p{L}\p{N}_]+)/gu) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

/** Extract @mentions. */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

/** Deterministic monochrome gradient avatar fallback from a string seed. */
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  // Black & white theme: vary lightness only → a brushed-graphite avatar.
  const l = 26 + (h % 26); // 26%–51%
  return `linear-gradient(135deg, hsl(0 0% ${l + 13}%), hsl(0 0% ${Math.max(l - 8, 8)}%))`;
}

export function pluralize(n: number, singular: string, plural?: string) {
  return `${n} ${n === 1 ? singular : plural ?? singular + "s"}`;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Linkify captions/comments: turn #tags, @mentions, and urls into spans. */
export type Token = { type: "text" | "hashtag" | "mention" | "url"; value: string };
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /(#[\p{L}\p{N}_]+)|(@[a-zA-Z0-9_.]+)|((?:https?:\/\/)[^\s]+)/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: "text", value: text.slice(last, m.index) });
    if (m[1]) tokens.push({ type: "hashtag", value: m[1] });
    else if (m[2]) tokens.push({ type: "mention", value: m[2] });
    else if (m[3]) tokens.push({ type: "url", value: m[3] });
    last = re.lastIndex;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}
