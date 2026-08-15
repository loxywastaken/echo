"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Grid3x3,
  Clapperboard,
  Tag,
  Bookmark,
  Lock,
  MoreHorizontal,
  Settings,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { FollowButton } from "@/components/FollowButton";
import { PostGrid } from "@/components/PostGrid";
import { PostModal } from "@/components/post/PostModal";
import { EditProfileModal } from "./EditProfileModal";
import { UserListModal } from "./UserListModal";
import { ProfileMenu } from "./ProfileMenu";
import { ReportModal } from "@/components/ReportModal";
import { api } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/lib/types";
import type { Relationship } from "@/lib/social-types";
import { formatCount } from "@/lib/utils";
import Link from "next/link";

type Profile = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  status: string;
  counts: { posts: number; followers: number; following: number };
};

const TABS = [
  { key: "posts", icon: Grid3x3, label: "Posts" },
  { key: "clips", icon: Clapperboard, label: "Clips" },
  { key: "tagged", icon: Tag, label: "Tagged" },
  { key: "saved", icon: Bookmark, label: "Saved" },
] as const;

export function ProfileClient({ username }: { username: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rel, setRel] = useState<Relationship | null>(null);
  const [canView, setCanView] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);

  const [edit, setEdit] = useState(false);
  const [list, setList] = useState<null | "followers" | "following">(null);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [active, setActive] = useState<Post | null>(null);

  const isSelf = rel?.isSelf || user?.username === username;

  async function loadProfile() {
    try {
      const r = await api.get(`/api/users/${username}`);
      setProfile(r.profile);
      setRel(r.relationship);
      setCanView(r.canView);
      setFollowerCount(r.profile.counts.followers);
    } catch {
      setNotFound(true);
    }
  }
  useEffect(() => {
    setNotFound(false);
    setProfile(null);
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (!profile || (!canView && !isSelf)) {
      setLoadingPosts(false);
      return;
    }
    setLoadingPosts(true);
    api
      .get(`/api/users/${username}/posts?tab=${tab}`)
      .then((r) => setPosts(r.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profile, canView]);

  async function message() {
    const { id } = await api.post("/api/conversations", { userId: profile!.id });
    router.push(`/messages/${id}`);
  }

  if (notFound)
    return (
      <div className="grid h-[70vh] place-items-center">
        <EmptyState title="Account not found" hint={`@${username} doesn't exist or is unavailable.`} />
      </div>
    );
  if (!profile || !rel)
    return <div className="grid h-[70vh] place-items-center"><Spinner /></div>;

  const tabs = isSelf ? TABS : TABS.filter((t) => t.key !== "saved");
  const locked = profile.isPrivate && !canView && !isSelf;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      {/* banner */}
      <div className="sm:px-4 sm:pt-4">
        <div className="h-36 w-full overflow-hidden bg-surface-2 sm:h-56 sm:rounded-2xl">
          {profile.cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={profile.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-elevated via-surface-2 to-bg" />
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6">
        {/* avatar + actions */}
        <div className="flex items-end justify-between gap-3">
          <div className="-mt-12 rounded-full bg-bg p-1 shadow-card sm:-mt-14">
            <Avatar src={profile.avatar} name={profile.displayName} size={108} />
          </div>
          <div className="flex flex-wrap justify-end gap-2 py-3">
            {isSelf ? (
              <>
                <Button size="sm" variant="subtle" onClick={() => setEdit(true)}>Edit profile</Button>
                <Link href="/settings"><Button size="sm" variant="subtle"><Settings size={16} /></Button></Link>
              </>
            ) : rel.isBlocked ? (
              <Button size="sm" variant="danger" onClick={() => setMenu(true)}>Blocked</Button>
            ) : (
              <>
                <FollowButton
                  username={profile.username}
                  isPrivate={profile.isPrivate}
                  initialFollowing={rel.isFollowing}
                  initialRequested={rel.requested}
                  onChange={(f, d) => setFollowerCount((c) => c + d)}
                />
                <Button size="sm" variant="subtle" onClick={message}><MessageCircle size={16} /> Message</Button>
                <Button size="sm" variant="subtle" onClick={() => setMenu(true)}><MoreHorizontal size={18} /></Button>
              </>
            )}
          </div>
        </div>

        {/* identity */}
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-xl font-semibold leading-tight">{profile.displayName}</h1>
            {profile.isVerified && <VerifiedBadge size={18} />}
            {profile.isPrivate && (
              <span className="flex items-center gap-1 text-xs text-muted"><Lock size={13} /> Private</span>
            )}
          </div>
          <p className="text-sm text-muted">@{profile.username}</p>

          {(profile.bio || profile.location || profile.website) && (
            <div className="mt-3 space-y-1.5 text-sm">
              {profile.bio && <p className="whitespace-pre-wrap text-text/90">{profile.bio}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                {profile.location && (
                  <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-accent hover:underline">
                    <LinkIcon size={13} /> {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <span><b className="font-semibold">{formatCount(profile.counts.posts)}</b> <span className="text-muted">posts</span></span>
            <button onClick={() => setList("followers")} className="press hover:opacity-70">
              <b className="font-semibold">{formatCount(followerCount)}</b> <span className="text-muted">followers</span>
            </button>
            <button onClick={() => setList("following")} className="press hover:opacity-70">
              <b className="font-semibold">{formatCount(profile.counts.following)}</b> <span className="text-muted">following</span>
            </button>
          </div>
        </div>

      {/* tabs */}
      <div className="mt-6 flex border-t border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "flex flex-1 items-center justify-center gap-1.5 border-t-2 py-3 text-sm font-semibold transition sm:flex-none sm:px-10 " +
              (tab === t.key ? "border-text text-text" : "border-transparent text-faint hover:text-muted")
            }
          >
            <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* content */}
      <div className="mt-4">
        {locked ? (
          <EmptyState icon={<Lock size={24} />} title="This account is private" hint="Follow this account to see their photos and videos." />
        ) : loadingPosts ? (
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton aspect-square sm:rounded-lg" />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Grid3x3 size={24} />}
            title={tab === "saved" ? "No saved posts" : tab === "tagged" ? "No tagged posts" : "No posts yet"}
            hint={isSelf && tab === "posts" ? "Share your first moment on Vortex." : undefined}
          />
        ) : (
          <PostGrid posts={posts} onOpen={setActive} />
        )}
      </div>
      </div>

      {/* modals */}
      {isSelf && <EditProfileModal open={edit} onClose={() => setEdit(false)} onSaved={loadProfile} />}
      {list && (
        <UserListModal
          open={!!list}
          onClose={() => setList(null)}
          username={username}
          type={list}
          isOwnProfile={isSelf}
          onRemoved={() => setFollowerCount((c) => Math.max(0, c - 1))}
        />
      )}
      <ProfileMenu
        open={menu}
        onClose={() => setMenu(false)}
        username={username}
        rel={rel}
        onReport={() => setReport(true)}
        onChanged={(patch) => setRel((r) => (r ? { ...r, ...patch } : r))}
      />
      <ReportModal open={report} onClose={() => setReport(false)} targetType="user" targetId={profile.id} />
      <PostModal
        post={active ?? undefined}
        open={!!active}
        onClose={() => setActive(null)}
        onDeleted={(id) => setPosts((p) => p.filter((x) => x.id !== id))}
      />
    </div>
  );
}
