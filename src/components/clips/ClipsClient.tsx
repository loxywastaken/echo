"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, Music2, Play, Volume2, VolumeX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner, EmptyState } from "@/components/ui/misc";
import { CommentsModal } from "@/components/post/CommentsModal";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import type { Post } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";
import { Clapperboard } from "lucide-react";

export function ClipsClient() {
  const [clips, setClips] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(true);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (done) return;
    const r = await api.get(`/api/clips${cursor ? `?cursor=${cursor}` : ""}`);
    setClips((c) => [...c, ...r.clips]);
    setCursor(r.nextCursor);
    if (!r.nextCursor) setDone(true);
    setLoading(false);
  }, [cursor, done]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  if (loading) return <div className="grid h-[70vh] place-items-center"><Spinner /></div>;
  if (clips.length === 0)
    return (
      <div className="grid h-[70vh] place-items-center">
        <EmptyState icon={<Clapperboard size={26} />} title="No clips yet" hint="Share a video as an Echo Clip to get things started." />
      </div>
    );

  return (
    <div className="no-scrollbar mx-auto h-[calc(100dvh-7rem)] max-w-[460px] snap-y snap-mandatory overflow-y-auto md:h-[calc(100vh-1.5rem)] md:py-3">
      {clips.map((clip) => (
        <ClipItem key={clip.id} clip={clip} muted={muted} setMuted={setMuted} />
      ))}
      <div ref={sentinel} className="grid h-16 place-items-center">
        {!done && <Spinner />}
      </div>
    </div>
  );
}

function ClipItem({ clip, muted, setMuted }: { clip: Post; muted: boolean; setMuted: (m: boolean) => void }) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(clip.likedByMe);
  const [likeCount, setLikeCount] = useState(clip.likeCount);
  const [saved, setSaved] = useState(clip.savedByMe);
  const [playing, setPlaying] = useState(true);
  const [comments, setComments] = useState(false);
  const media = clip.media[0];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [clip.id]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  async function like() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    const r = await api.post(`/api/posts/${clip.id}/like`).catch(() => null);
    if (r) { setLiked(r.liked); setLikeCount(r.likeCount); }
  }
  async function save() {
    setSaved((s) => !s);
    await api.post(`/api/posts/${clip.id}/save`).catch(() => {});
  }
  function share() {
    navigator.clipboard?.writeText(`${location.origin}/p/${clip.id}`);
    toast("Link copied", "success");
  }

  return (
    <div className="relative flex h-full snap-start items-center justify-center bg-black md:rounded-2xl md:overflow-hidden">
      {media?.type === "video" ? (
        <video
          ref={videoRef}
          src={media.url}
          className="h-full w-full object-contain"
          loop
          muted={muted}
          playsInline
          onClick={togglePlay}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media?.url} alt="" className="h-full w-full object-cover" />
      )}

      {!playing && (
        <button onClick={togglePlay} className="absolute inset-0 grid place-items-center" aria-label="Play">
          <Play size={64} className="fill-white/90 text-white/90" />
        </button>
      )}

      {/* mute */}
      <button
        onClick={() => setMuted(!muted)}
        className="press absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
        aria-label="Toggle sound"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* action rail */}
      <div className="absolute bottom-4 right-3 flex flex-col items-center gap-5 text-white">
        <button onClick={like} className="press flex flex-col items-center gap-1">
          <Heart size={30} className={cn(liked && "fill-danger text-danger")} />
          <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
        </button>
        <button onClick={() => setComments(true)} className="press flex flex-col items-center gap-1">
          <MessageCircle size={29} />
          <span className="text-xs font-semibold">{formatCount(clip.commentCount)}</span>
        </button>
        <button onClick={share} className="press flex flex-col items-center gap-1">
          <Send size={27} />
          <span className="text-xs font-semibold">Share</span>
        </button>
        <button onClick={save} className="press flex flex-col items-center gap-1">
          <Bookmark size={27} className={cn(saved && "fill-white")} />
        </button>
      </div>

      {/* info */}
      <div className="absolute bottom-4 left-3 right-16 text-white">
        <Link href={`/${clip.author.username}`} className="mb-2 flex items-center gap-2">
          <Avatar src={clip.author.avatar} name={clip.author.displayName} size={34} />
          <span className="text-sm font-semibold">{clip.author.username}</span>
          {clip.author.isVerified && <VerifiedBadge size={13} />}
        </Link>
        {clip.caption && <p className="mb-1.5 line-clamp-2 text-sm">{clip.caption}</p>}
        <p className="flex items-center gap-1.5 text-xs text-white/80">
          <Music2 size={13} /> {clip.audioName || `Original audio · ${clip.author.username}`}
        </p>
      </div>

      <CommentsModal open={comments} onClose={() => setComments(false)} post={clip} />
    </div>
  );
}
