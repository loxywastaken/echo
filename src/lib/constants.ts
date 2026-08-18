// Central brand + domain constants. Using string unions instead of Prisma
// enums keeps the schema SQLite-portable while staying type-safe here.

export const BRAND = {
  name: "Vortex",
  tagline: "Share what echoes.",
  description: "A place for the moments worth repeating.",
  wordmark: "Vortex",
};

export const SESSION_COOKIE = "echo_session";
export const ACCOUNTS_COOKIE = "echo_accounts"; // JSON array of stored account tokens
export const SESSION_TTL_DAYS = 7;
export const SESSION_TTL_DAYS_REMEMBER = 30;

export const ROLE = { USER: "user", ADMIN: "admin" } as const;
export const USER_STATUS = { ACTIVE: "active", SUSPENDED: "suspended", BANNED: "banned" } as const;

export const NOTIF = {
  LIKE: "like",
  COMMENT: "comment",
  REPLY: "reply",
  FOLLOW: "follow",
  FOLLOW_REQUEST: "follow_request",
  MENTION: "mention",
  TAG: "tag",
  MESSAGE: "message",
  ADMIN: "admin",
} as const;

export const REPORT_REASONS = [
  "Spam",
  "Nudity or sexual activity",
  "Hate speech or symbols",
  "Violence or dangerous organisations",
  "Bullying or harassment",
  "False information",
  "Scam or fraud",
  "Intellectual property violation",
  "Self-harm",
  "Something else",
] as const;

export const EXPLORE_CATEGORIES = [
  "For You",
  "Travel",
  "Music",
  "Art",
  "Food",
  "Sport",
  "Fashion",
  "Nature",
  "Tech",
  "Gaming",
] as const;

export const STORY_BG_COLORS = [
  "linear-gradient(135deg,#7c5cff,#22d3ee)",
  "linear-gradient(135deg,#f43f5e,#f59e0b)",
  "linear-gradient(135deg,#10b981,#3b82f6)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#0ea5e9,#14b8a6)",
  "#18181b",
];

export const MAX_UPLOAD_MB = 50;
export const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

export const PAGE_SIZE = 8;
