"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Smile, Send, Sticker, X, Trash2, Reply, Heart, Phone, Video } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner } from "@/components/ui/misc";
import { api } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import { useCall } from "@/context/CallContext";
import type { Message, PublicUser } from "@/lib/types";
import { clockTime, cn } from "@/lib/utils";

const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢", "🙏", "👍"];
const GIFS = [
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
];

export function ChatView({ conversationId, onBack }: { conversationId: string; onBack?: () => void }) {
  const { user } = useAuth();
  const { startCall, busy: callBusy } = useCall();
  const [convo, setConvo] = useState<{ isGroup: boolean; name: string | null; members: (PublicUser & { online: boolean })[] } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [readAt, setReadAt] = useState<Record<string, string>>({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [reactOn, setReactOn] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastId = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  const other = convo?.members[0];
  const title = convo?.isGroup ? convo.name || convo.members.map((m) => m.username).join(", ") : other?.username;

  const load = useCallback(async () => {
    const [d, m] = await Promise.all([
      api.get(`/api/conversations/${conversationId}`),
      api.get(`/api/conversations/${conversationId}/messages`),
    ]);
    setConvo(d.conversation);
    setMessages(m.messages);
    lastId.current = m.messages.at(-1)?.id ?? null;
    applyReads(m.readCursors);
    setLoading(false);
    api.post(`/api/conversations/${conversationId}/read`).catch(() => {});
    scrollDown();
  }, [conversationId]);

  function applyReads(cursors: { userId: string; lastReadAt: string }[]) {
    const map: Record<string, string> = {};
    cursors.forEach((c) => (map[c.userId] = c.lastReadAt));
    setReadAt(map);
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Poll for new messages + typing + reads.
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const q = lastId.current ? `?after=${lastId.current}` : "";
        const r = await api.get(`/api/conversations/${conversationId}/messages${q}`);
        if (r.messages.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((p: Message) => p.id));
            const fresh = r.messages.filter((m: Message) => !ids.has(m.id));
            if (fresh.length) {
              lastId.current = fresh.at(-1).id;
              api.post(`/api/conversations/${conversationId}/read`).catch(() => {});
              scrollDown();
              return [...prev, ...fresh];
            }
            return prev;
          });
        }
        setTyping((r.typing || []).length > 0);
        applyReads(r.readCursors || []);
      } catch {}
    }, 2500);
    return () => clearInterval(iv);
  }, [conversationId]);

  function onType(v: string) {
    setText(v);
    clearTimeout(typingTimer.current);
    api.post(`/api/conversations/${conversationId}/typing`).catch(() => {});
  }

  async function send(payload?: { body?: string; mediaUrl?: string; mediaType?: string }) {
    const body = payload?.body ?? text.trim();
    if (!body && !payload?.mediaUrl) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      body: body || null,
      mediaUrl: payload?.mediaUrl || null,
      mediaType: (payload?.mediaType as any) || null,
      deleted: false,
      createdAt: new Date().toISOString(),
      senderId: user!.id,
      sender: user as any,
      isMine: true,
      replyTo: replyTo ? { id: replyTo.id, body: replyTo.body, senderId: replyTo.senderId } : null,
      reactions: [],
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    setReplyTo(null);
    setShowEmoji(false);
    setShowGif(false);
    scrollDown();
    try {
      const { message } = await api.post(`/api/conversations/${conversationId}/messages`, {
        body,
        mediaUrl: payload?.mediaUrl,
        mediaType: payload?.mediaType,
        replyToId: optimistic.replyTo?.id,
      });
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? message : x)));
      lastId.current = message.id;
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  async function uploadImage(f: File) {
    try {
      const { files } = await api.upload([f]);
      send({ mediaUrl: files[0].url, mediaType: files[0].type });
    } catch {}
  }

  async function react(messageId: string, emoji: string) {
    setReactOn(null);
    const { reactions } = await api.post(`/api/messages/${messageId}/react`, { emoji }).catch(() => ({ reactions: null }));
    if (reactions) setMessages((m) => m.map((x) => (x.id === messageId ? { ...x, reactions } : x)));
  }
  async function unsend(messageId: string) {
    await api.del(`/api/messages/${messageId}`).catch(() => {});
    setMessages((m) => m.map((x) => (x.id === messageId ? { ...x, deleted: true, body: null, mediaUrl: null } : x)));
  }

  if (loading) return <div className="grid h-full place-items-center"><Spinner /></div>;

  const lastMine = [...messages].reverse().find((m) => m.isMine);
  const seen =
    lastMine &&
    Object.values(readAt).some((t) => new Date(t) >= new Date(lastMine.createdAt));

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        {onBack && (
          <button onClick={onBack} className="press md:hidden" aria-label="Back">
            <ArrowLeft size={22} />
          </button>
        )}
        <Link href={other ? `/${other.username}` : "#"} className="flex min-w-0 items-center gap-3">
          <Avatar src={other?.avatar} name={title || "?"} size={38} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              {title} {other?.isVerified && <VerifiedBadge size={13} />}
            </p>
            <p className="text-xs text-faint">
              {typing ? <span className="text-accent">typing…</span> : other?.online ? "Active now" : "Offline"}
            </p>
          </div>
        </Link>

        {other && !convo?.isGroup && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => startCall(other, "audio")}
              disabled={callBusy}
              className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
              aria-label="Voice call"
            >
              <Phone size={19} />
            </button>
            <button
              onClick={() => startCall(other, "video")}
              disabled={callBusy}
              className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text disabled:opacity-40"
              aria-label="Video call"
            >
              <Video size={20} />
            </button>
          </div>
        )}
      </header>

      {/* messages */}
      <div className="flex-1 space-y-1 overflow-y-auto thin-scrollbar px-3 py-4">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const grouped = prev && prev.senderId === m.senderId;
          return (
            <div key={m.id} className={cn("group flex items-end gap-2", m.isMine ? "flex-row-reverse" : "flex-row")}>
              {!m.isMine && (
                <div className="w-7">{!grouped && <Avatar src={m.sender.avatar} name={m.sender.displayName} size={28} />}</div>
              )}
              <div className={cn("relative max-w-[72%]", m.isMine ? "items-end" : "items-start")}>
                {m.replyTo && (
                  <div className={cn("mb-0.5 rounded-lg bg-surface-2 px-2 py-1 text-xs text-faint", m.isMine ? "text-right" : "")}>
                    ↩︎ {m.replyTo.body?.slice(0, 60) || "media"}
                  </div>
                )}
                {m.deleted ? (
                  <div className="rounded-2xl border border-border px-3 py-2 text-sm italic text-faint">Message deleted</div>
                ) : m.mediaUrl ? (
                  <div className="overflow-hidden rounded-2xl">
                    {m.mediaType === "video" ? (
                      <video src={m.mediaUrl} controls className="max-h-64 rounded-2xl" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.mediaUrl} alt="" className="max-h-64 rounded-2xl object-cover" />
                    )}
                    {m.body && <p className="mt-1 text-sm">{m.body}</p>}
                  </div>
                ) : (
                  <div className={cn("rounded-2xl px-3.5 py-2 text-sm", m.isMine ? "bg-accent-gradient text-white" : "bg-surface-2 text-text")}>
                    {m.body}
                  </div>
                )}

                {m.reactions.length > 0 && (
                  <div className={cn("mt-0.5 flex", m.isMine ? "justify-end" : "justify-start")}>
                    <span className="rounded-full border border-border bg-surface px-1.5 text-xs">
                      {Array.from(new Set(m.reactions.map((r) => r.emoji))).join("")} {m.reactions.length}
                    </span>
                  </div>
                )}

                {/* hover actions */}
                {!m.deleted && (
                  <div className={cn("absolute top-1/2 hidden -translate-y-1/2 items-center gap-1 group-hover:flex", m.isMine ? "right-full mr-1" : "left-full ml-1")}>
                    <button onClick={() => setReactOn(reactOn === m.id ? null : m.id)} className="press text-faint hover:text-text"><Heart size={14} /></button>
                    <button onClick={() => setReplyTo(m)} className="press text-faint hover:text-text"><Reply size={14} /></button>
                    {m.isMine && <button onClick={() => unsend(m.id)} className="press text-faint hover:text-danger"><Trash2 size={14} /></button>}
                  </div>
                )}
                {reactOn === m.id && (
                  <div className={cn("absolute z-10 mt-1 flex gap-1 rounded-full border border-border bg-elevated px-2 py-1 shadow-card", m.isMine ? "right-0" : "left-0")}>
                    {EMOJIS.slice(0, 6).map((e) => (
                      <button key={e} onClick={() => react(m.id, e)} className="press text-lg">{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {seen && <p className="pr-1 text-right text-xs text-faint">Seen</p>}
        {typing && (
          <div className="flex items-center gap-1 pl-9 text-faint">
            <span className="h-2 w-2 animate-pulse rounded-full bg-faint" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-faint [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-faint [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="border-t border-border p-3">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted">
            Replying to {replyTo.isMine ? "yourself" : replyTo.sender.username}: {replyTo.body?.slice(0, 40)}
            <button onClick={() => setReplyTo(null)}><X size={14} /></button>
          </div>
        )}
        {showEmoji && (
          <div className="mb-2 flex flex-wrap gap-1.5 rounded-xl bg-surface-2 p-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setText((t) => t + e)} className="press text-xl">{e}</button>
            ))}
          </div>
        )}
        {showGif && (
          <div className="mb-2 grid grid-cols-4 gap-1.5 rounded-xl bg-surface-2 p-2">
            {GIFS.map((g) => (
              // eslint-disable-next-line @next/next/no-img-element
              <button key={g} onClick={() => send({ mediaUrl: g, mediaType: "gif" })} className="press overflow-hidden rounded-lg">
                <img src={g} alt="gif" className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button onClick={() => fileRef.current?.click()} className="press text-muted hover:text-text" aria-label="Image"><ImageIcon size={22} /></button>
          <button onClick={() => { setShowGif((v) => !v); setShowEmoji(false); }} className="press text-muted hover:text-text" aria-label="GIF"><Sticker size={22} /></button>
          <button onClick={() => { setShowEmoji((v) => !v); setShowGif(false); }} className="press text-muted hover:text-text" aria-label="Emoji"><Smile size={22} /></button>
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Message…"
            className="input-base flex-1 !rounded-full"
          />
          <button onClick={() => send()} disabled={sending || (!text.trim())} className="press grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-gradient text-white disabled:opacity-40">
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
