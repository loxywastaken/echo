"use client";

import { Heart, MessageCircle, Layers, Film } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatCount } from "@/lib/utils";

export function PostGrid({ posts, onOpen }: { posts: Post[]; onOpen: (p: Post) => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
      {posts.map((post) => {
        const m = post.media[0];
        return (
          <button
            key={post.id}
            onClick={() => onOpen(post)}
            className="group relative aspect-square overflow-hidden bg-surface-2 sm:rounded-lg"
          >
            {m?.type === "video" ? (
              <video src={m.url} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m?.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
            )}
            <div className="absolute right-1.5 top-1.5 text-white drop-shadow">
              {post.isClip ? <Film size={16} /> : post.media.length > 1 ? <Layers size={16} /> : null}
            </div>
            <div className="absolute inset-0 hidden items-center justify-center gap-5 bg-black/45 text-white opacity-0 transition group-hover:opacity-100 sm:flex">
              <span className="flex items-center gap-1.5 font-semibold">
                <Heart size={18} className="fill-white" /> {formatCount(post.likeCount)}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <MessageCircle size={18} className="fill-white" /> {formatCount(post.commentCount)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
