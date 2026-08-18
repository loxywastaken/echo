"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users2, ImageIcon, MessageSquare, Flag, Clapperboard, Ban, PauseCircle, Search, Trash2, Check, X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner, EmptyState, VerifiedBadge } from "@/components/ui/misc";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { cn, formatCount, timeAgo } from "@/lib/utils";

const TABS = ["Overview", "Reports", "Users"] as const;

export function AdminClient() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("press flex-1 rounded-lg py-2 text-sm font-semibold", tab === t ? "bg-accent-gradient text-white" : "text-muted hover:text-text")}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" ? <Overview /> : tab === "Reports" ? <Reports /> : <UsersTab />}
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  useEffect(() => {
    api.get("/api/admin/stats").then(setData).catch(() => {});
    api.get("/api/admin/activity").then(setActivity).catch(() => {});
  }, []);
  if (!data) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const cards = [
    { label: "Users", value: data.stats.users, icon: Users2, color: "text-accent" },
    { label: "Posts", value: data.stats.posts, icon: ImageIcon, color: "text-accent-2" },
    { label: "Comments", value: data.stats.comments, icon: MessageSquare, color: "text-success" },
    { label: "Open reports", value: data.stats.openReports, icon: Flag, color: "text-danger" },
    { label: "Active stories", value: data.stats.activeStories, icon: Clapperboard, color: "text-warn" },
    { label: "Suspended", value: data.stats.suspended, icon: PauseCircle, color: "text-warn" },
    { label: "Banned", value: data.stats.banned, icon: Ban, color: "text-danger" },
  ];
  const max = Math.max(1, ...data.series.map((s: any) => Math.max(s.posts, s.users)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <c.icon size={20} className={c.color} />
            <p className="mt-2 font-display text-2xl font-bold">{formatCount(c.value)}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {/* activity chart */}
      <div className="card p-5">
        <p className="mb-4 text-sm font-semibold text-muted">Activity â last 7 days</p>
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {data.series.map((s: any, i: number) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-[110px] w-full items-end justify-center gap-1">
                <div className="w-3 rounded-t bg-accent" style={{ height: `${(s.posts / max) * 100}%` }} title={`${s.posts} posts`} />
                <div className="w-3 rounded-t" style={{ height: `${(s.users / max) * 100}%`, background: "rgb(var(--accent-2))" }} title={`${s.users} new users`} />
              </div>
              <span className="text-xs text-faint">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Posts</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgb(var(--accent-2))" }} /> New users</span>
        </div>
      </div>

      {activity && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-muted">Recent posts</p>
            <div className="space-y-2">
              {activity.recentPosts.slice(0, 6).map((p: any) => (
                <Link key={p.id} href={`/p/${p.id}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-surface-2">
                  <div className="h-10 w-10 overflow-hidden rounded-md bg-surface-2">
                    {p.thumb && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.thumb} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.caption || "(no caption)"}</p>
                    <p className="text-xs text-faint">@{p.author?.username} Â· {timeAgo(p.createdAt)} {p.status === "removed" && <span className="text-danger">Â· removed</span>}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <p className="mb-3 text-sm font-semibold text-muted">Newest users</p>
            <div className="space-y-2">
              {activity.recentUsers.map((u: any) => (
                <Link key={u.id} href={`/${u.username}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-surface-2">
                  <Avatar src={u.avatar} name={u.displayName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.username}</p>
                    <p className="text-xs text-faint">joined {timeAgo(u.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Reports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await api.get("/api/admin/reports?status=open").catch(() => ({ reports: [] }));
    setReports(r.reports);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(fn: () => Promise<any>, id: string, msg: string) {
    await fn().catch(() => {});
    setReports((r) => r.filter((x) => x.id !== id));
    toast(msg, "success");
  }
  const setStatus = (id: string, status: string) => api.patch("/api/admin/reports", { id, status });

  if (loading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (reports.length === 0) return <EmptyState icon={<Flag size={24} />} title="No open reports" hint="The moderation queue is clear." />;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-danger/15 px-2 py-0.5 font-semibold text-danger">{r.targetType}</span>
            <span className="text-muted">{r.reason}</span>
            <span className="ml-auto text-faint">reported by @{r.reporter?.username} Â· {timeAgo(r.createdAt)}</span>
          </div>

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
            {r.targetType === "post" && r.post && (
              <>
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-surface">
                  {r.post.thumb && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.post.thumb} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.post.caption || "(no caption)"}</p>
                  <p className="text-xs text-faint">by @{r.post.author?.username}</p>
                </div>
              </>
            )}
            {r.targetType === "comment" && r.comment && (
              <div className="min-w-0 flex-1">
                <p className="text-sm">â{r.comment.body}â</p>
                <p className="text-xs text-faint">by @{r.comment.author?.username}</p>
              </div>
            )}
            {r.targetType === "user" && r.reportedUser && (
              <div className="flex items-center gap-3">
                <Avatar src={r.reportedUser.avatar} name={r.reportedUser.displayName} size={40} />
                <div>
                  <p className="text-sm font-semibold">@{r.reportedUser.username}</p>
                  <p className="text-xs text-faint">{r.reportedUser.displayName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {r.targetType === "post" && r.post && (
              <Button size="sm" variant="danger" onClick={() => act(() => api.del(`/api/admin/posts/${r.post.id}`), r.id, "Post removed")}>
                <Trash2 size={14} /> Remove post
              </Button>
            )}
            {r.targetType === "comment" && r.comment && (
              <Button size="sm" variant="danger" onClick={() => act(() => api.del(`/api/admin/comments/${r.comment.id}`), r.id, "Comment removed")}>
                <Trash2 size={14} /> Remove comment
              </Button>
            )}
            {r.targetType === "user" && r.reportedUser && (
              <>
                <Button size="sm" variant="subtle" onClick={() => act(() => api.patch("/api/admin/users", { id: r.reportedUser.id, action: "suspend" }), r.id, "User suspended")}>Suspend</Button>
                <Button size="sm" variant="danger" onClick={() => act(() => api.patch("/api/admin/users", { id: r.reportedUser.id, action: "ban" }), r.id, "User banned")}>Ban</Button>
              </>
            )}
            <Button size="sm" variant="subtle" onClick={() => act(() => setStatus(r.id, "resolved"), r.id, "Marked resolved")}><Check size={14} /> Resolve</Button>
            <Button size="sm" variant="ghost" onClick={() => act(() => setStatus(r.id, "dismissed"), r.id, "Dismissed")}><X size={14} /> Dismiss</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await api.get(`/api/admin/users?q=${encodeURIComponent(q)}`).catch(() => ({ users: [] }));
    setUsers(r.users);
    setLoading(false);
  }
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function act(id: string, action: string) {
    try {
      await api.patch("/api/admin/users", { id, action });
      toast("Done", "success");
      load();
    } catch (e: any) {
      toast(e?.message || "Failed", "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-surface-2 px-3">
        <Search size={16} className="text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users by name, @username or email" className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
      </div>
      {loading ? (
        <div className="grid place-items-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card flex flex-wrap items-center gap-3 p-3">
              <Link href={`/${u.username}`}><Avatar src={u.avatar} name={u.displayName} size={44} /></Link>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-semibold">
                  {u.username}
                  {u.isVerified && <VerifiedBadge size={14} type={u.badgeType || "blue"} />}
                  {u.role === "admin" && <span className="rounded bg-accent/15 px-1.5 text-xs text-accent">admin</span>}
                  <span className={cn("rounded px-1.5 text-xs", u.status === "active" ? "bg-success/15 text-success" : u.status === "suspended" ? "bg-warn/15 text-warn" : "bg-danger/15 text-danger")}>{u.status}</span>
                </p>
                <p className="truncate text-xs text-faint">{u.email} Â· {formatCount(u.followers)} followers Â· {u.posts} posts</p>
              </div>
              {u.role !== "admin" && (
                <div className="flex flex-wrap gap-1.5">
                  {u.status !== "active" && <Button size="sm" variant="subtle" onClick={() => act(u.id, "activate")}>Reactivate</Button>}
                  {u.status === "active" && <Button size="sm" variant="subtle" onClick={() => act(u.id, "suspend")}>Suspend</Button>}
                  {u.status !== "banned" && <Button size="sm" variant="danger" onClick={() => act(u.id, "ban")}>Ban</Button>}
                  {u.isVerified ? (
                    <Button size="sm" variant="ghost" onClick={() => act(u.id, "unverify")}>Unverify</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => act(u.id, "verify")}>Blue â</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(u.id, "verify-gold")}>Gold â</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(u.id, "verify-gray")}>Gray â</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && <EmptyState icon={<Users2 size={22} />} title="No users found" />}
        </div>
      )}
    </div>
  );
}
