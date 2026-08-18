// Client-side DTO types mirroring the serializers in lib/serialize.ts.

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  isVerified: boolean;
  badgeType: "blue" | "gold" | "gray";
  isPrivate: boolean;
  bio?: string | null;
};

export type Media = {
  id: string;
  url: string;
  type: "image" | "video";
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
};

export type Post = {
  id: string;
  caption: string;
  location: string | null;
  status: string;
  commentsDisabled: boolean;
  isClip: boolean;
  audioName: string | null;
  createdAt: string;
  updatedAt: string;
  author: PublicUser;
  media: Media[];
  taggedUsers: PublicUser[];
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isMine: boolean;
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: PublicUser;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
  isMine: boolean;
  replies?: Comment[];
};

export type Story = {
  id: string;
  type: "image" | "video" | "text";
  url: string | null;
  text: string | null;
  bgColor: string | null;
  createdAt: string;
  expiresAt: string;
  author: PublicUser;
  viewCount: number;
  seenByMe: boolean;
  isMine: boolean;
};
export type StoryTray = { author: PublicUser; stories: Story[]; hasUnseen: boolean };

export type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  message: string | null;
  createdAt: string;
  actor: PublicUser | null;
  post: { id: string; thumb: string | null } | null;
  commentId: string | null;
};

export type Message = {
  id: string;
  body: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  deleted: boolean;
  createdAt: string;
  senderId: string;
  sender: PublicUser;
  isMine: boolean;
  replyTo: { id: string; body: string | null; senderId: string } | null;
  reactions: { emoji: string; userId: string }[];
};

export type Conversation = {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  updatedAt: string;
  members: PublicUser[];
  unread: number;
  lastMessage: Message | null;
};
