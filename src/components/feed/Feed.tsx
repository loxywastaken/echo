"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Home } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { Skeleton, EmptyState, Spinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client";
import type { Post } from "@/lib/types";

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingMore || done) return;
    setLoadingMore(true);
    try {
      const r = await api.get<{ posts: Post[]; nextCursor: string | null }>(
        `/api/feed${cursor ? `?cursor=${cursor}` : ""}`
      );
      setPosts((p) => [...p, ...r.posts]);
      setCursor(r.nextCursor);
      if (!r.nextCursor) setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, done]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // Prepend newly created posts.
  useEffect(() => {
    const onNew = (e: Event) => {
      const post = (e as CustomEvent).detail as Post;
      if (post && !post.isClip) setPosts((p) => [post, ...p]);
    };
    window.addEventListener("echo:post-created", onNew);
    return () => window.removeEventListener("echo:post-created", onNew);
  }, []);

  const removePost = (id: string) => setPosts((p) => p.filter((x) => x.id !== id));

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sm:card sm:overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Home size={26} />}
        title="Your feed is quiet"
        hint="Follow some creators or share your first post to fill it up."
      />
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={removePost} />
      ))}
      <div ref={sentinel} className="py-6">
        {loadingMore && (
          <div className="grid place-items-center">
            <Spinner />
          </div>
        )}
        {done && (
          <div className="flex flex-col items-center gap-1 py-4 text-center text-sm text-faint">
            <Sparkles size={18} className="text-accent" />
            You&apos;re all caught up
          </div>
        )}
      </div>
    </div>
  );
}
