"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Send, Eye, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/misc";
import type { StoryTray } from "@/lib/types";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { timeAgo, cn } from "@/lib/utils";

const IMG_MS = 5000;
const VID_MS = 15000;

export function StoryViewer({
  trays,
  startIndex,
  onClose,
  onChange,
}: {
  trays: StoryTray[];
  startIndex: number;
  onClose: () => void;
  onChange?: (t: StoryTray[]) => void;
}) {
  const { toast } = useToast();
  const [tIdx, setTIdx] = useState(startIndex);
  const [sIdx, setSIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState("");
  const [viewers, setViewers] = useState<{ username: string; avatar: string | null; displayName: string }[] | null>(null);
  const local = useRef([...trays]);

  const tray = local.current[tIdx];
  const story = tray?.stories[sIdx];

  const next = useCallback(() => {
    setProgress(0);
    setSIdx((s) => {
      const t = local.current[tIdx];
      if (s + 1 < t.stories.length) return s + 1;
      // move to next tray
      if (tIdx + 1 < local.current.length) {
        setTIdx(tIdx + 1);
        return 0;
      }
      onClose();
      return s;
    });
  }, [tIdx, onClose]);

  const prev = useCallback(() => {
    setProgress(0);
    setSIdx((s) => {
      if (s > 0) return s - 1;
      if (tIdx > 0) {
        const pt = local.current[tIdx - 1];
        setTIdx(tIdx - 1);
        return Math.max(0, pt.stories.length - 1);
      }
      return 0;
    });
  }, [tIdx]);

  // Mark viewed + reset local seen state.
  useEffect(() => {
    if (!story) return;
    if (!story.isMine) {
      api.post(`/api/stories/${story.id}/view`).catch(() => {});
      story.seenByMe = true;
      tray.hasUnseen = tray.stories.some((s) => !s.seenByMe && !s.isMine);
      onChange?.([...local.current]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Progress timer.
  useEffect(() => {
    if (!story || paused) return;
    const duration = story.type === "video" ? VID_MS : IMG_MS;
    const started = performance.now();
    const startProgress = progress;
    const id = setInterval(() => {
      const elapsed = performance.now() - started;
      const p = startProgress + elapsed / duration;
      if (p >= 1) {
        clearInterval(id);
        next();
      } else {
        setProgress(p);
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  if (!story) return null;

  async function react(emoji: string) {
    await api.post(`/api/stories/${story.id}/react`, { emoji }).catch(() => {});
    toast(`Reacted ${emoji}`, "success");
  }
  async function sendReply() {
    if (!reply.trim()) return;
    try {
      const { id } = await api.post<{ id: string }>("/api/conversations", { userId: story.author.id });
      await api.post(`/api/conversations/${id}/messages`, { body: `↩️ Replied to your story: ${reply}` });
      toast("Reply sent", "success");
      setReply("");
    } catch {
      toast("Could not send reply", "error");
    }
  }
  async function loadViewers() {
    setPaused(true);
    const r = await api.get(`/api/stories/${story.id}`).catch(() => null);
    if (r) setViewers(r.viewers);
  }
  async function del() {
    await api.del(`/api/stories/${story.id}`).catch(() => {});
    toast("Story deleted", "success");
    next();
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95">
      <button onClick={onClose} className="press absolute right-4 top-4 z-20 text-white/80 hover:text-white" aria-label="Close">
        <X size={28} />
      </button>

      {/* nav arrows (desktop) */}
      <button onClick={prev} className="press absolute left-4 z-20 hidden text-white/60 hover:text-white md:block">
        <ChevronLeft size={34} />
      </button>
      <button onClick={next} className="press absolute right-4 z-20 hidden text-white/60 hover:text-white md:block">
        <ChevronRight size={34} />
      </button>

      <div
        className="relative h-full w-full max-w-[440px] overflow-hidden bg-black sm:h-[92vh] sm:rounded-2xl"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
      >
        {/* progress bars */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-3">
          {tray.stories.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white transition-[width]"
                style={{ width: i < sIdx ? "100%" : i === sIdx ? `${progress * 100}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* header */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 px-3 pt-6">
          <Avatar src={story.author.avatar} name={story.author.displayName} size={34} />
          <span className="text-sm font-semibold text-white">{story.author.username}</span>
          {story.author.isVerified && <VerifiedBadge size={13} />}
          <span className="text-xs text-white/60">{timeAgo(story.createdAt)}</span>
        </div>

        {/* content */}
        <div className="grid h-full place-items-center">
          {story.type === "text" ? (
            <div
              className="grid h-full w-full place-items-center px-8 text-center"
              style={{ background: story.bgColor || "linear-gradient(135deg,#3a3a40,#0a0a0b)" }}
            >
              <p className="font-display text-2xl font-bold text-white">{story.text}</p>
            </div>
          ) : story.type === "video" ? (
            <video src={story.url!} className="h-full w-full object-contain" autoPlay playsInline muted={paused} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.url!} alt="" className="h-full w-full object-contain" />
          )}
          {story.type !== "text" && story.text && (
            <p className="absolute bottom-24 left-1/2 max-w-[80%] -translate-x-1/2 rounded-xl bg-black/50 px-3 py-1.5 text-center text-white backdrop-blur">
              {story.text}
            </p>
          )}
        </div>

        {/* tap zones */}
        <button className="absolute left-0 top-12 h-[calc(100%-8rem)] w-1/3" onClick={prev} aria-label="Previous" />
        <button className="absolute right-0 top-12 h-[calc(100%-8rem)] w-1/3" onClick={next} aria-label="Next" />

        {/* footer */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
          {story.isMine ? (
            <div className="flex items-center justify-between">
              <button onClick={loadViewers} className="press flex items-center gap-1.5 text-sm text-white/90">
                <Eye size={18} /> {story.viewCount} {story.viewCount === 1 ? "view" : "views"}
              </button>
              <button onClick={del} className="press text-white/80 hover:text-danger" aria-label="Delete story">
                <Trash2 size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                placeholder={`Reply to ${story.author.username}…`}
                className="flex-1 rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
              <button onClick={() => react("❤️")} className="press text-white" aria-label="React">
                <Heart size={22} />
              </button>
              <button onClick={sendReply} className="press text-white" aria-label="Send">
                <Send size={20} />
              </button>
            </div>
          )}
        </div>

        {/* viewers sheet */}
        {viewers && (
          <div className="absolute inset-0 z-20 flex flex-col bg-black/80 backdrop-blur" onClick={() => { setViewers(null); setPaused(false); }}>
            <div className="mt-auto max-h-[60%] overflow-y-auto rounded-t-3xl bg-surface p-4" onClick={(e) => e.stopPropagation()}>
              <p className="mb-3 font-semibold">{viewers.length} viewers</p>
              {viewers.map((v) => (
                <div key={v.username} className="flex items-center gap-3 py-2">
                  <Avatar src={v.avatar} name={v.displayName} size={36} />
                  <div>
                    <p className="text-sm font-semibold">{v.username}</p>
                    <p className="text-xs text-faint">{v.displayName}</p>
                  </div>
                </div>
              ))}
              {viewers.length === 0 && <p className="py-6 text-center text-sm text-muted">No views yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
