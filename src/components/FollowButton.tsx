"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";

export function FollowButton({
  username,
  isPrivate,
  initialFollowing,
  initialRequested,
  size = "sm",
  full,
  onChange,
}: {
  username: string;
  isPrivate?: boolean;
  initialFollowing: boolean;
  initialRequested?: boolean;
  size?: "sm" | "md" | "lg";
  full?: boolean;
  onChange?: (following: boolean, delta: number) => void;
}) {
  const { toast } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [requested, setRequested] = useState(!!initialRequested);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      if (following || requested) {
        await api.del(`/api/users/${username}/follow`);
        if (following) onChange?.(false, -1);
        setFollowing(false);
        setRequested(false);
      } else {
        const r = await api.post(`/api/users/${username}/follow`);
        if (r.requested) {
          setRequested(true);
          toast("Follow request sent", "success");
        } else {
          setFollowing(true);
          onChange?.(true, 1);
        }
      }
    } catch (e: any) {
      toast(e?.message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  const label = following ? "Following" : requested ? "Requested" : isPrivate ? "Follow" : "Follow";
  const variant = following || requested ? "subtle" : "primary";

  return (
    <Button variant={variant} size={size} loading={busy} onClick={toggle} className={full ? "w-full" : ""}>
      {label}
    </Button>
  );
}
