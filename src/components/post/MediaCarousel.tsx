"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Media } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MediaCarousel({
  media,
  onDoubleTap,
  rounded = true,
}: {
  media: Media[];
  onDoubleTap?: () => void;
  rounded?: boolean;
}) {
  const [i, setI] = useState(0);
  const item = media[i];
  const first = media[0];
  const ratio =
    first?.width && first?.height ? Math.min(Math.max(first.width / first.height, 0.8), 1.91) : 0.8;

  return (
    <div
      className={cn("relative select-none overflow-hidden bg-black", rounded && "rounded-none")}
      style={{ aspectRatio: String(ratio) }}
      onDoubleClick={onDoubleTap}
    >
      {item.type === "video" ? (
        <video
          src={item.url}
          className="h-full w-full object-contain"
          controls
          playsInline
          loop
          muted
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.altText || ""} className="h-full w-full object-cover" />
      )}

      {media.length > 1 && (
        <>
          {i > 0 && (
            <button
              onClick={() => setI((v) => v - 1)}
              className="press absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {i < media.length - 1 && (
            <button
              onClick={() => setI((v) => v + 1)}
              className="press absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          )}
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            {i + 1}/{media.length}
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {media.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i ? "w-1.5 bg-white" : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
