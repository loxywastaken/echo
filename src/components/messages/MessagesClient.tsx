"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, PenSquare, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner, EmptyState } from "@/components/ui/misc";
import { ChatView } from "./ChatView";
import { NewMessageModal } from "./NewMessageModal";
import { api } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import type { Conversation } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function MessagesClient({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [compose, setCompose] = useState(false);

  async function load() {
    try {
      const r = await api.get<{ conversations: Conversation[] }>("/api/conversations");
      setConvos(r.conversations);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  function titleFor(c: Conversation) {
    if (c.isGroup) return c.name || c.members.map((m) => m.username).join(", ");
    return c.members[0]?.username || "Conversation";
  }
  const filtered = convos.filter((c) => titleFor(c).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex h-[calc(100dvh-7rem)] md:h-screen">
      {/* list */}
      <div className={cn("flex w-full flex-col border-r border-border md:w-[360px]", activeId && "hidden md:flex")}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <h1 className="font-display text-lg font-bold">{user?.username}</h1>
          <button onClick={() => setCompose(true)} className="press text-text" aria-label="New message"><PenSquare size={22} /></button>
        </div>
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-surface-2 px-3">
          <Search size={16} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="flex-1 bg-transparent py-2 text-sm outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {loading ? (
            <div className="grid place-items-center py-16"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<MessageCircle size={22} />} title="No conversations" hint="Start a chat with the pencil icon." />
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                className={cn("press flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2", activeId === c.id && "bg-surface-2")}
              >
                <Avatar src={c.isGroup ? c.avatar : c.members[0]?.avatar} name={titleFor(c)} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    <span className="truncate">{titleFor(c)}</span>
                    {!c.isGroup && c.members[0]?.isVerified && <VerifiedBadge size={12} />}
                  </p>
                  <p className={cn("truncate text-xs", c.unread ? "font-semibold text-text" : "text-faint")}>
                    {c.lastMessage?.isMine ? "You: " : ""}
                    {c.lastMessage?.deleted ? "Message deleted" : c.lastMessage?.body || (c.lastMessage?.mediaUrl ? "Sent an attachment" : "No messages yet")}
                    {c.lastMessage && <span className="text-faint"> · {timeAgo(c.lastMessage.createdAt)}</span>}
                  </p>
                </div>
                {c.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-gradient" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* chat */}
      <div className={cn("min-w-0 flex-1", !activeId && "hidden md:block")}>
        {activeId ? (
          <ChatView conversationId={activeId} onBack={() => router.push("/messages")} />
        ) : (
          <div className="grid h-full place-items-center">
            <EmptyState
              icon={<MessageCircle size={28} />}
              title="Your messages"
              hint="Send private photos and messages to a friend or group."
            />
          </div>
        )}
      </div>

      <NewMessageModal open={compose} onClose={() => setCompose(false)} />
    </div>
  );
}
