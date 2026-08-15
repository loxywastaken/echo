"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/misc";
import { api } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export function EditProfileModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    username: user?.username || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
    isPrivate: user?.isPrivate || false,
  });
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [cover, setCover] = useState(user?.cover || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | "avatar" | "cover">(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function pick(f: File, which: "avatar" | "cover") {
    setUploading(which);
    try {
      const { files } = await api.upload([f]);
      if (which === "avatar") setAvatar(files[0].url);
      else setCover(files[0].url);
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch("/api/profile", { ...form, avatar, cover });
      await refresh();
      toast("Profile updated", "success");
      onSaved();
      onClose();
    } catch (e: any) {
      toast(e?.message || "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" className="sm:max-w-md">
      <div className="space-y-4 p-4">
        {/* Cover / banner */}
        <div>
          <button
            onClick={() => coverRef.current?.click()}
            className="press relative block h-28 w-full overflow-hidden rounded-xl bg-surface-2"
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="block h-full w-full bg-gradient-to-br from-elevated via-surface-2 to-bg" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/35 text-white opacity-0 transition hover:opacity-100">
              {uploading === "cover" ? "Uploading…" : <span className="flex items-center gap-1.5 text-sm font-semibold"><ImagePlus size={18} /> Change cover</span>}
            </span>
          </button>
          {cover && (
            <div className="mt-1 text-right">
              <button onClick={() => setCover("")} className="text-xs text-muted hover:text-danger">Remove cover</button>
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0], "cover")} />
        </div>

        {/* Avatar */}
        <div className="-mt-8 flex flex-col items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="press relative rounded-full bg-bg p-1">
            <Avatar src={avatar} name={form.displayName || "?"} size={84} />
            <span className="absolute inset-1 grid place-items-center rounded-full bg-black/40 text-white opacity-0 transition hover:opacity-100">
              <Camera size={22} />
            </span>
          </button>
          <button onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-accent">
            {uploading === "avatar" ? "Uploading…" : "Change photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pick(e.target.files[0], "avatar")} />
        </div>

        <Input label="Name" value={form.displayName} onChange={set("displayName")} />
        <Input label="Username" value={form.username} onChange={set("username")} autoCapitalize="none" />
        <Textarea label="Bio" value={form.bio} onChange={set("bio")} rows={3} maxLength={160} />
        <Input label="Website" value={form.website} onChange={set("website")} placeholder="https://" />
        <Input label="Location" value={form.location} onChange={set("location")} />

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-3">
          <div>
            <p className="text-sm font-medium">Private account</p>
            <p className="text-xs text-faint">Only approved followers can see your posts.</p>
          </div>
          <Toggle checked={form.isPrivate} onChange={(v) => setForm((f) => ({ ...f, isPrivate: v }))} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
