import { z } from "zod";

// Route names that can't be usernames (profiles live at /[username]).
export const RESERVED_USERNAMES = new Set([
  "explore", "clips", "messages", "notifications", "create", "settings",
  "admin", "guidelines", "login", "signup", "logout", "forgot-password",
  "reset-password", "verify-email", "api", "uploads", "u", "home", "about",
  "help", "support", "echo",
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(20, "At most 20 characters")
  .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, . and _ only")
  .refine((u) => !u.startsWith(".") && !u.endsWith("."), "Cannot start or end with a dot")
  .refine((u) => !RESERVED_USERNAMES.has(u.toLowerCase()), "That username is reserved");

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  username: usernameSchema,
  displayName: z.string().trim().min(1, "Required").max(40),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const createPostSchema = z.object({
  caption: z.string().max(2200).optional().default(""),
  location: z.string().max(80).optional(),
  media: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(["image", "video"]),
        width: z.number().optional(),
        height: z.number().optional(),
        duration: z.number().optional(),
        altText: z.string().max(200).optional(),
      })
    )
    .min(1, "Add at least one photo or video")
    .max(10),
  taggedUsernames: z.array(z.string()).optional().default([]),
  commentsDisabled: z.boolean().optional().default(false),
  isClip: z.boolean().optional().default(false),
  audioName: z.string().max(80).optional(),
});

export const editPostSchema = z.object({
  caption: z.string().max(2200).optional(),
  commentsDisabled: z.boolean().optional(),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Say something").max(1000),
  parentId: z.string().optional(),
});

export const storySchema = z.object({
  type: z.enum(["image", "video", "text"]),
  url: z.string().optional(),
  text: z.string().max(400).optional(),
  bgColor: z.string().optional(),
});

export const messageSchema = z.object({
  body: z.string().max(2000).optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["image", "video", "gif"]).optional(),
  replyToId: z.string().optional(),
});

export const editProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(160).optional(),
  website: z.string().max(120).optional(),
  location: z.string().max(80).optional(),
  avatar: z.string().optional(),
  cover: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export const settingsSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
  showActivity: z.boolean().optional(),
  allowComments: z.enum(["everyone", "followers", "none"]).optional(),
  allowMentions: z.enum(["everyone", "followers", "none"]).optional(),
  allowTags: z.enum(["everyone", "followers", "none"]).optional(),
  notifyLikes: z.boolean().optional(),
  notifyComments: z.boolean().optional(),
  notifyFollowers: z.boolean().optional(),
  notifyMessages: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "user"]),
  targetId: z.string(),
  reason: z.string().min(1),
  details: z.string().max(500).optional(),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input";
}
