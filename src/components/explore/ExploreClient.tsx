"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Hash, TrendingUp, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner, EmptyState } from "@/components/ui/misc";
import { FollowButton } from "@/components/FollowButton";
import { PostGrid } from "@/components/PostGrid";
import { PostModal } from "@/components/post/PostModal";
import { api } from "@/lib/client";
import type { Post } from "@/lib/types";
import { EXPLORE_CATEGORIES } from "@/lib/constants";
import { formatCount } from "@/lib/utils";

export function ExploreClient() {
  const params = useSearchParams();
  const router = useRouter();
  const tag = params.get("tag");

  const [posts, setPosts] = useState<Post[]>([]);
  const [trending, setTrending] = useState<{ tag: string; count: number }[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState<Post | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // Hashtag view
  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    api.get(`/api/hashtags/${encodeURIComponent(tag)}`).then((r) => {
      setPosts(r.posts);
      setDone(true);
      setLoading(false);
    });
  }, [tag]);

  const loadMore = useCallback(async () => {
    if (tag || done) return;
    const r = await api.get(`/api/explore${cursor ? `?cursor=${cursor}` : ""}`);
    setPosts((p) => (cursor ? [...p, ...r.posts] : r.posts));
    if (!cursor) {
      setTrending(r.trending || []);
      setCreators(r.creators || []);
    }
    setCursor(r.nextCursor);
    if (!r.nextCursor) setDone(true);
    setLoading(false);
  }, [cursor, done, tag]);

  useEffect(() => {
    if (!tag) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || tag) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "500px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, tag]);

  if (tag) {
    return (
      <div className="mx-auto max-w-4xl px-2 py-4 sm:px-4 sm:py-6">
        <button onClick={() => router.push("/explore")} className="press mb-4 flex items-center gap-2 text-sm text-muted hover:text-text">
          <ArrowLeft size={18} /> Explore
        </button>
        <div className="mb-6 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-gradient text-white">
            <Hash size={28} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">#{tag}</h1>
            <p className="text-sm text-muted">{formatCount(posts.length)} posts</p>
          </div>
        </div>
        {loading ? (
          <Grid loading />
        ) : posts.length ? (
          <PostGrid posts={posts} onOpen={setActive} />
        ) : (
          <EmptyState icon={<Hash size={24} />} title="No posts yet" hint={`Be the first to post with #${tag}.`} />
        )}
        <PostModal post={active ?? undefined} open={!!active} onClose={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-2 py-4 sm:px-4 sm:py-6">
      {/* categories */}
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {EXPLORE_CATEGORIES.map((c, i) => (
          <button
            key={c}
            onClick={() => i > 0 && router.push(`/explore?tag=${c.toLowerCase()}`)}
            className={
              "press shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium " +
              (i === 0 ? "border-transparent bg-accent-gradient text-white" : "border-border text-muted hover:bg-surface-2")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* trending + creators */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
            <TrendingUp size={16} className="text-accent" /> Trending hashtags
          </p>
          <div className="flex flex-wrap gap-2">
            {trending.length ? (
              trending.map((t) => (
                <Link
                  key={t.tag}
                  href={`/explore?tag=${t.tag}`}
                  className="press rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium hover:bg-elevated"
                >
                  #{t.tag} <span className="text-faint">{formatCount(t.count)}</span>
                </Link>
              ))
            ) : (
              <span className="text-sm text-faint">Nothing trending yet.</span>
            )}
          </div>
        </div>
        <div className="card p-4">
          <p className="mb-3 text-sm font-semibold text-muted">Recommended creators</p>
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {creators.map((c) => (
              <div key={c.id} className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center">
                <Link href={`/${c.username}`}>
                  <Avatar src={c.avatar} name={c.displayName} size={54} />
                </Link>
                <Link href={`/${c.username}`} className="flex items-center gap-0.5 truncate text-xs font-semibold">
                  <span className="truncate">{c.username}</span>
                  {c.isVerified && <VerifiedBadge size={11} />}
                </Link>
                <FollowButton username={c.username} initialFollowing={false} isPrivate={c.isPrivate} />
              </div>
            ))}
            {creators.length === 0 && <span className="text-sm text-faint">No suggestions yet.</span>}
          </div>
        </div>
      </div>

      {loading && posts.length === 0 ? (
        <Grid loading />
      ) : (
        <PostGrid posts={posts} onOpen={setActive} />
      )}
      <div ref={sentinel} className="grid place-items-center py-8">
        {!done && <Spinner />}
      </div>
      <PostModal post={active ?? undefined} open={!!active} onClose={() => setActive(null)} />
    </div>
  );
}

function Grid({ loading }: { loading?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="skeleton aspect-square sm:rounded-lg" />
      ))}
    </div>
  );
}
