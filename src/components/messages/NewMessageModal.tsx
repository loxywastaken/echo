"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/misc";
import { api } from "@/lib/client";
import type { PublicUser } from "@/lib/types";

export function NewMessageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [selected, setSelected] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!q.trim()) return setResults([]);
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await api.get(`/api/search?q=${encodeURIComponent(q)}&type=people`);
      setResults(r.people);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  function toggle(u: PublicUser) {
    setSelected((s) => (s.find((x) => x.id === u.id) ? s.filter((x) => x.id !== u.id) : [...s, u]));
  }

  async function start() {
    setCreating(true);
    try {
      const body =
        selected.length > 1
          ? { userIds: selected.map((u) => u.id), isGroup: true, name: groupName || undefined }
          : { userId: selected[0].id };
      const { id } = await api.post("/api/conversations", body);
      onClose();
      setSelected([]);
      setQ("");
      router.push(`/messages/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New message" className="sm:max-w-md h-[70vh]">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search size={17} className="text-faint" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>

        {selected.length > 1 && (
          <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name (optional)" className="m-3 input-base" />
        )}

        <div className="flex-1 overflow-y-auto thin-scrollbar p-2">
          {loading ? (
            <div className="grid place-items-center py-12"><Spinner /></div>
          ) : (
            results.map((u) => {
              const on = !!selected.find((x) => x.id === u.id);
              return (
                <button key={u.id} onClick={() => toggle(u)} className="press flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                  <Avatar src={u.avatar} name={u.displayName} size={42} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold">{u.username}</p>
                    <p className="truncate text-xs text-faint">{u.displayName}</p>
                  </div>
                  <span className={"grid h-5 w-5 place-items-center rounded-full border " + (on ? "border-accent bg-accent-gradient text-white" : "border-border")}>
                    {on && <Check size={13} />}
                  </span>
                </button>
              );
            })
          )}
          {!loading && q && results.length === 0 && <p className="py-10 text-center text-sm text-faint">No people found.</p>}
        </div>

        <div className="border-t border-border p-3">
          <Button variant="primary" className="w-full" disabled={selected.length === 0} loading={creating} onClick={start}>
            {selected.length > 1 ? `Create group (${selected.length})` : "Chat"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
