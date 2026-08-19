"use client";

import { useEffect, useState } from "react";
import {
  User, Lock, Bell, Palette, ShieldCheck, Ban, KeyRound, Monitor, Sun, Moon, LogOut, Check,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle, Spinner } from "@/components/ui/misc";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { api } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { cn, timeAgo } from "@/lib/utils";

type Settings = Record<string, any>;
const SECTIONS = [
  { key: "profile", label: "Edit profile", icon: User },
  { key: "account", label: "Account", icon: KeyRound },
  { key: "privacy", label: "Privacy", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "blocked", label: "Blocked", icon: Ban },
] as const;

export function SettingsClient() {
  const { user, refresh, logout } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<(typeof SECTIONS)[number]["key"]>("profile");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    api.get("/api/settings").then((r) => setSettings(r.settings)).catch(() => {});
  }, []);

  async function update(patch: Settings) {
    setSettings((s) => ({ ...s, ...patch }));
    try {
      await api.patch("/api/settings", patch);
    } catch (e: any) {
      toast(e?.message || "Could not save", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 font-display text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* nav */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto md:w-56 md:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                "press flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                section === s.key ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2"
              )}
            >
              <s.icon size={18} /> {s.label}
            </button>
          ))}
          <button onClick={logout} className="press mt-2 hidden items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-surface-2 md:flex">
            <LogOut size={18} /> Log out
          </button>
        </nav>

        {/* content */}
        <div className="min-w-0 flex-1">
          {!settings ? (
            <div className="grid place-items-center py-20"><Spinner /></div>
          ) : section === "profile" ? (
            <Card>
              <div className="flex items-center gap-4">
                <Avatar src={user?.avatar} name={user?.displayName || "?"} size={64} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{user?.username}</p>
                  <p className="truncate text-sm text-muted">{user?.displayName}</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setEdit(true)}>Edit</Button>
              </div>
              {user?.bio && <p className="mt-4 text-sm text-muted">{user.bio}</p>}
              <EditProfileModal open={edit} onClose={() => setEdit(false)} onSaved={refresh} />
            </Card>
          ) : section === "account" ? (
            <AccountSection settings={settings} onUpdate={update} onUsername={refresh} />
          ) : section === "privacy" ? (
            <Card title="Privacy">
              <RowToggle label="Private account" hint="Only approved followers can see your posts." checked={settings.isPrivate} onChange={(v) => update({ isPrivate: v })} />
              <RowToggle label="Show activity status" hint="Let others see when you're active." checked={settings.showActivity} onChange={(v) => update({ showActivity: v })} />
              <RowSelect label="Who can comment" value={settings.allowComments} onChange={(v) => update({ allowComments: v })} />
              <RowSelect label="Who can mention you" value={settings.allowMentions} onChange={(v) => update({ allowMentions: v })} />
              <RowSelect label="Who can tag you" value={settings.allowTags} onChange={(v) => update({ allowTags: v })} />
            </Card>
          ) : section === "notifications" ? (
            <Card title="Notifications">
              <RowToggle label="Likes" checked={settings.notifyLikes} onChange={(v) => update({ notifyLikes: v })} />
              <RowToggle label="Comments" checked={settings.notifyComments} onChange={(v) => update({ notifyComments: v })} />
              <RowToggle label="New followers" checked={settings.notifyFollowers} onChange={(v) => update({ notifyFollowers: v })} />
              <RowToggle label="Messages" checked={settings.notifyMessages} onChange={(v) => update({ notifyMessages: v })} />
            </Card>
          ) : section === "appearance" ? (
            <AppearanceSection theme={settings.theme} onUpdate={update} />
          ) : section === "security" ? (
            <SecuritySection settings={settings} onUpdate={update} />
          ) : (
            <BlockedSection />
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      {title && <h2 className="mb-4 font-semibold">{title}</h2>}
      {children}
    </div>
  );
}
function RowToggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-faint">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
function RowSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <p className="text-sm font-medium">{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none">
        <option value="everyone">Everyone</option>
        <option value="followers">Followers</option>
        <option value="none">No one</option>
      </select>
    </div>
  );
}

function AccountSection({ settings, onUpdate, onUsername }: { settings: Settings; onUpdate: (p: Settings) => void; onUsername: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState(settings.username);
  const [email, setEmail] = useState(settings.email);
  const [pw, setPw] = useState({ current: "", next: "" });

  async function saveUsername() {
    try { await api.patch("/api/profile", { username }); onUsername(); toast("Username updated", "success"); }
    catch (e: any) { toast(e?.message || "Failed", "error"); }
  }
  async function saveEmail() {
    try { await onUpdate({ email }); toast("Email updated", "success"); }
    catch (e: any) { toast(e?.message || "Failed", "error"); }
  }
  async function savePassword() {
    try { await api.put("/api/settings", pw); setPw({ current: "", next: "" }); toast("Password changed", "success"); }
    catch (e: any) { toast(e?.message || "Failed", "error"); }
  }

  return (
    <div className="space-y-4">
      <Card title="Username">
        <div className="flex gap-2">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="flex-1" />
          <Button variant="subtle" onClick={saveUsername}>Save</Button>
        </div>
      </Card>
      <Card title="Email">
        <div className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="flex-1" />
          <Button variant="subtle" onClick={saveEmail}>Save</Button>
        </div>
        <p className="mt-2 text-xs text-faint">{settings.emailVerified ? "â Verified" : "Not verified"}</p>
      </Card>
      <Card title="Change password">
        <div className="space-y-3">
          <Input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Button variant="primary" onClick={savePassword} disabled={!pw.current || pw.next.length < 8}>Update password</Button>
        </div>
      </Card>
    </div>
  );
}

function AppearanceSection({ theme, onUpdate }: { theme: string; onUpdate: (p: Settings) => void }) {
  const { setTheme } = useTheme();
  const opts = [
    { key: "dark", label: "Dark", icon: Moon },
    { key: "light", label: "Light", icon: Sun },
    { key: "system", label: "System", icon: Monitor },
  ];
  return (
    <Card title="Appearance">
      <p className="mb-3 text-sm text-muted">Choose how Vortex looks to you.</p>
      <div className="grid grid-cols-3 gap-3">
        {opts.map((o) => (
          <button
            key={o.key}
            onClick={() => { setTheme(o.key as any); onUpdate({ theme: o.key }); }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 transition",
              theme === o.key ? "border-accent bg-accent/10" : "border-border hover:bg-surface-2"
            )}
          >
            <o.icon size={22} className={theme === o.key ? "text-accent" : "text-muted"} />
            <span className="text-sm font-medium">{o.label}</span>
            {theme === o.key && <Check size={14} className="text-accent" />}
          </button>
        ))}
      </div>
    </Card>
  );
}

function SecuritySection({ settings, onUpdate }: { settings: Settings; onUpdate: (p: Settings) => void }) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await api.get("/api/settings/sessions").catch(() => ({ sessions: [] }));
    setSessions(r.sessions);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    await api.del(`/api/settings/sessions?id=${id}`).catch(() => {});
    setSessions((s) => s.filter((x) => x.id !== id));
  }
  async function revokeAll() {
    await api.del(`/api/settings/sessions?all=1`).catch(() => {});
    load();
    toast("Signed out of other sessions", "success");
  }

  return (
    <div className="space-y-4">
      <Card title="Two-factor authentication">
        <RowToggle
          label="Enable 2FA"
          hint="Add an extra layer of security at login (demo)."
          checked={settings.twoFactorEnabled}
          onChange={(v) => { onUpdate({ twoFactorEnabled: v }); toast(v ? "2FA enabled" : "2FA disabled", "success"); }}
        />
      </Card>
      <Card title="Active sessions & login history">
        {loading ? (
          <div className="grid place-items-center py-8"><Spinner /></div>
        ) : (
          <>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Monitor size={20} className="text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.device} {s.current && <span className="text-xs text-success">Â· This device</span>}</p>
                    <p className="text-xs text-faint">{s.ip || "unknown ip"} Â· active {timeAgo(s.lastActive)}</p>
                  </div>
                  {!s.current && <Button size="sm" variant="subtle" onClick={() => revoke(s.id)}>Revoke</Button>}
                </div>
              ))}
            </div>
            {sessions.length > 1 && <Button variant="danger" size="sm" className="mt-3" onClick={revokeAll}>Log out all other sessions</Button>}
          </>
        )}
      </Card>
    </div>
  );
}

function BlockedSection() {
  const { toast } = useToast();
  const [data, setData] = useState<{ blocked: any[]; muted: any[]; restricted: any[] }>({ blocked: [], muted: [], restricted: [] });
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await api.get("/api/blocks").catch(() => ({ blocked: [], muted: [], restricted: [] }));
    setData(r);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function undo(kind: "block" | "mute" | "restrict", username: string) {
    await api.del(`/api/users/${username}/${kind}`).catch(() => {});
    load();
    toast("Updated", "success");
  }

  const groups = [
    { key: "block" as const, title: "Blocked accounts", list: data.blocked },
    { key: "mute" as const, title: "Muted accounts", list: data.muted },
    { key: "restrict" as const, title: "Restricted accounts", list: data.restricted },
  ];

  if (loading) return <Card><div className="grid place-items-center py-8"><Spinner /></div></Card>;

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <Card key={g.key} title={g.title}>
          {g.list.length === 0 ? (
            <p className="text-sm text-faint">None yet.</p>
          ) : (
            <div className="space-y-2">
              {g.list.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar src={u.avatar} name={u.displayName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.username}</p>
                    <p className="truncate text-xs text-faint">{u.displayName}</p>
                  </div>
                  <Button size="sm" variant="subtle" onClick={() => undo(g.key, u.username)}>
                    Un{g.key}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
