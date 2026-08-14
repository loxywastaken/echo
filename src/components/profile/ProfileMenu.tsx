"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/lib/social-types";

export function ProfileMenu({
  open,
  onClose,
  username,
  rel,
  onReport,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  rel: Relationship;
  onReport: () => void;
  onChanged: (patch: Partial<Relationship>) => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle(kind: "block" | "mute" | "restrict", active: boolean) {
    setBusy(true);
    try {
      await api[active ? "del" : "post"](`/api/users/${username}/${kind}`);
      const key = kind === "block" ? "isBlocked" : kind === "mute" ? "isMuted" : "isRestricted";
      onChanged({ [key]: !active } as any);
      toast(active ? `Un${kind}ed` : `${kind[0].toUpperCase()}${kind.slice(1)}ed @${username}`, "success");
      onClose();
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  const actions = [
    { label: rel.isBlocked ? "Unblock" : "Block", danger: true, onClick: () => toggle("block", rel.isBlocked) },
    { label: rel.isMuted ? "Unmute" : "Mute", onClick: () => toggle("mute", rel.isMuted) },
    { label: rel.isRestricted ? "Unrestrict" : "Restrict", onClick: () => toggle("restrict", rel.isRestricted) },
    { label: "Report", danger: true, onClick: () => { onClose(); onReport(); } },
    {
      label: "Copy profile link",
      onClick: () => {
        navigator.clipboard?.writeText(`${location.origin}/${username}`);
        toast("Link copied", "success");
        onClose();
      },
    },
  ];

  return (
    <Modal open={open} onClose={onClose} hideClose className="sm:max-w-xs">
      <div className="p-2">
        {actions.map((a) => (
          <button
            key={a.label}
            disabled={busy}
            onClick={a.onClick}
            className={cn(
              "press w-full rounded-xl px-4 py-3.5 text-center text-sm font-semibold hover:bg-surface-2 disabled:opacity-50",
              a.danger ? "text-danger" : "text-text"
            )}
          >
            {a.label}
          </button>
        ))}
        <button onClick={onClose} className="press mt-1 w-full rounded-xl px-4 py-3.5 text-center text-sm text-muted hover:bg-surface-2">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
