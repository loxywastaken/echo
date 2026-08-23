"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/client";
import type { StoryTray } from "@/lib/types";
import { StoryViewer } from "./StoryViewer";
import { StoryComposer } from "./StoryComposer";
import { cn } from "@/lib/utils";

export function StoriesBar() {
  const { user } = useAuth();
  const [trays, setTrays] = useState<StoryTray[]>([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState<number | null>(null);
  const [composer, setComposer] = useState(false);

  async function load() {
    try {
      const r = await api.get<{ trays: StoryTray[] }>("/api/stories");
      setTrays(r.trays);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const myTray = trays.find((t) => t.author.id === user?.id);
  const others = trays.filter((t) => t.author.id !== user?.id);

  return (
    <div className="border-b border-border/80">
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-3 py-3.5 sm:px-4">
        {/* Your story */}
        <button
          onClick={() => (myTray ? setStart(trays.indexOf(myTray)) : setComposer(true))}
          className="press flex w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.displayName || "You"} size={56} ring={myTray?.hasUnseen ? "story" : "seen"} />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-bg bg-accent-gradient text-white">
              <Plus size={12} strokeWidth={3} />
            </span>
          </div>
          <span className="w-full truncate text-center text-[11px] font-medium text-muted">Your story</span>
        </button>

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <div className="skeleton h-[56px] w-[56px] rounded-full" />
              <div className="skeleton h-2.5 w-12 rounded" />
            </div>
          ))}

        {others.map((tray) => (
          <button
            key={tray.author.id}
            onClick={() => setStart(trays.indexOf(tray))}
            className="press flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <Avatar
              src={tray.author.avatar}
              name={tray.author.displayName}
              size={56}
              ring={tray.hasUnseen ? "story" : "seen"}
            />
            <span className={cn("w-full truncate text-center text-[11px] font-medium", tray.hasUnseen ? "text-text" : "text-muted")}>
              {tray.author.username}
            </span>
          </button>
        ))}
      </div>

      {start !== null && (
        <StoryViewer trays={trays} startIndex={start} onClose={() => setStart(null)} onChange={setTrays} />
      )}
      {composer && (
        <StoryComposer
          onClose={() => setComposer(false)}
          onPosted={() => {
            setComposer(false);
            load();
          }}
        />
      )}
    </div>
  );
}
