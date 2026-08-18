"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, UserPlus, MessageCircle, AtSign, Tag, Bell, Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { FollowButton } from "@/components/FollowButton";
import { api } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import type { NotificationItem, PublicUser } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const ICON: Record<string, React.ReactNode> = {
  like: <Heart size={14} className="fill-danger text-danger" />,
  comment: <MessageCircle size={14} className="text-accent" />,
  reply: <MessageCircle size={14} className="text-accent" />,
  follow: <UserPlus size={14} className="text-accent-2" />,
  follow_request: <UserPlus size={14} className="text-accent-2" />,
  mention: <AtSign size={14} className="text-accent" />,
  tag: <Tag size={14} className="text-accent" />,
  message: <MessageCircle size={14} className="text-accent" />,
  admin: <Bell size={14} className="text-warn" />,
};

function label(n: NotificationItem): string {
  switch (n.type) {
    case "like": return "liked your post";
    case "comment": return "commented on your post";
    case "reply": return "replied to your comment";
    case "follow": return n.message || "started following you";
    case "follow_request": return "requested to follow you";
    case "mention": return "mentioned you";
    case "tag": return "tagged you in a post";
    case "message": return n.message ? `sent: ${n.message}` : "sent you a message";
    case "admin": return n.message || "Notice from Echo";
    default: return "interacted with you";
  }
}

export function NotificationsClient() {
  const { refresh } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [requests, setRequests] = useState<{ id: string; user: PublicUser }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/api/notifications"), api.get("/api/follow-requests")])
      .then(([n, r]) => {
        setItems(n.notifications);
        setRequests(r.requests);
      })
      .finally(() => setLoading(false));
    // mark all read
    api.patch("/api/notifications").then(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept(id: string) {
    await api.post(`/api/follow-requests/${id}`).catch(() => {});
    setRequests((r) => r.filter((x) => x.id !== id));
  }
  async function decline(id: string) {
    await api.del(`/api/follow-requests/${id}`).catch(() => {});
    setRequests((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="mx-auto max-w-xl px-3 py-4 sm:py-6">
      <h1 className="mb-4 px-1 font-display text-xl font-bold">Notifications</h1>

      {loading ? (
        <div className="grid place-items-center py-20"><Spinner /></div>
      ) : (
        <>
          {requests.length > 0 && (
            <section className="mb-5">
              <p className="mb-2 px-1 text-sm font-semibold text-muted">Follow requests</p>
              <div className="space-y-1">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                    <Link href={`/${r.user.username}`}>
                      <Avatar src={r.user.avatar} name={r.user.displayName} size={44} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-sm font-semibold">{r.user.username} {r.user.isVerified && <VerifiedBadge size={12} type={r.user.badgeType || "blue"} />}</p>
                      <p className="truncate text-xs text-faint">wants to follow you</p>
                    </div>
                    <Button size="sm" variant="primary" onClick={() => accept(r.id)}><Check size={15} /></Button>
                    <Button size="sm" variant="subtle" onClick={() => decline(r.id)}><X size={15} /></Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {items.length === 0 && requests.length === 0 ? (
            <EmptyState icon={<Bell size={24} />} title="No notifications yet" hint="Likes, comments and follows will show up here." />
          ) : (
            <div className="space-y-0.5">
              {items.map((n) => (
                <div key={n.id} className={"flex items-center gap-3 rounded-xl px-1 py-2 " + (!n.read ? "bg-accent/5" : "")}>
                  <div className="relative">
                    {n.actor ? (
                      <Link href={`/${n.actor.username}`}>
                        <Avatar src={n.actor.avatar} name={n.actor.displayName} size={44} />
                      </Link>
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2"><Bell size={18} /></span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-bg bg-surface">
                      {ICON[n.type] || <Bell size={12} />}
                    </span>
                  </div>
                  <p className="min-w-0 flex-1 text-sm leading-snug">
                    {n.actor && (
                      <Link href={`/${n.actor.username}`} className="mr-1 font-semibold hover:underline">
                        {n.actor.username}
                      </Link>
                    )}
                    <span className="text-muted">{label(n)}</span>
                    <span className="ml-1 text-xs text-faint">{timeAgo(n.createdAt)}</span>
                  </p>
                  {n.post?.thumb && (
                    <Link href={`/p/${n.post.id}`} className="h-11 w-11 overflow-hidden rounded-md bg-surface-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.post.thumb} alt="" className="h-full w-full object-cover" />
                    </Link>
                  )}
                  {n.type === "follow" && n.actor && (
                    <FollowButton username={n.actor.username} initialFollowing={false} isPrivate={n.actor.isPrivate} />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
