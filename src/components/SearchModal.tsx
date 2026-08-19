"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Hash, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner } from "@/components/ui/misc";
import { api } from "@/lib/client";
import { formatCount } from "@/lib/utils";

type Results = {
  people: any[];
  hashtags: { tag: string; count: number }[];
  posts: { id: string; thumb: string | null }[];
  locations: string[];
};

const RECENTS_KEY = "echo:recent-searches";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      try {
        setRecents(JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]"));
      } catch {}
      setQ("");
      setRes(null);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) return setRes(null);
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await api.get<Results>(`/api/search?q=${encodeURIComponent(q)}`);
        setRes(r);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  function remember(term: string) {
    const next = [term, ...recents.filter((r) => r !== term)].slice(0, 8);
    setRecents(next);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  }
  function go(path: string, term?: string) {
    if (term) remember(term);
    onClose();
    router.push(path);
  }

  return (
    <Modal open={open} onClose={onClose} hideClose className="sm:max-w-lg h-[85vh] sm:h-[70vh]">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search size={18} className="text-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, tags, placesâ¦"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="press text-faint hover:text-text">
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} className="press text-sm text-muted hover:text-text">Cancel</button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-2">
          {!q.trim() ? (
            <div className="p-2">
              {recents.length > 0 ? (
                <>
                  <div className="mb-1 flex items-center justify-between px-2">
                    <span className="text-sm font-semibold text-muted">Recent</span>
                    <button
                      onClick={() => { setRecents([]); localStorage.removeItem(RECENTS_KEY); }}
                      className="text-xs text-accent hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  {recents.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQ(r)}
                      className="press flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-surface-2"
                    >
                      <Clock size={18} className="text-faint" />
          <span className="text-sm">{r}</span>
                    </button>
                  ))}
                </>
              ) : (
                <p className="px-2 py-8 text-center text-sm text-faint">Search Vortex for people, hashtags and places.</p>
              )}
            </div>
          ) : loading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : res ? (
            <div className="space-y-1">
              {res.people.map((u) => (
                <button
                  key={u.id}
                  onClick={() => go(`/${u.username}`, u.username)}
                  className="press flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2"
                >
                  <Avatar src={u.avatar} name={u.displayName} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-sm font-semibold">
                      {u.username} {u.isVerified && <VerifiedBadge size={13} type={u.badgeType || "blue"} />}
                    </p>
                    <p className="truncate text-xs text-faint">{u.displayName} Â· {formatCount(u.followers)} followers</p>
                  </div>
                </button>
              ))}
              {res.hashtags.map((h) => (
                <button
                  key={h.tag}
                  onClick={() => go(`/explore?tag=${h.tag}`, `#${h.tag}`)}
                  className="press flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2"><Hash size={20} /></span>
                  <div>
                    <p className="text-sm font-semibold">#{h.tag}</p>
                    <p className="text-xs text-faint">{formatCount(h.count)} posts</p>
                  </div>
                </button>
              ))}
              {res.locations.map((l) => (
                <button key={l} onClick={() => go(`/explore?q=${encodeURIComponent(l)}`, l)} className="press flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2"><TrendingUp size={18} /></span>
                  <p className="text-sm font-semibold">{l}</p>
                </button>
              ))}
              {res.people.length + res.hashtags.length + res.locations.length === 0 && (
                <p className="py-12 text-center text-sm text-faint">No results for â{q}â.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
