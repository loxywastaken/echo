// Client-safe relationship type (mirrors lib/social.ts Relationship).
export type Relationship = {
  isSelf: boolean;
  isFollowing: boolean;
  followsMe: boolean;
  requested: boolean;
  isBlocked: boolean;
  blockedBy: boolean;
  isMuted: boolean;
  isRestricted: boolean;
};
