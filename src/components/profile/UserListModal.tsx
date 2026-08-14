"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge, Spinner, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { FollowButton } from "@/components/FollowButton";
import { api } from "@/lib/client";
import { Users } from "lucide-react";

export function UserListModal({
  open,
  onClose,
  username,
  type,
  isOwnProfile,
  onRemoved,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  type: "followers" | "following";
  isOwnProfile?: boolean;
  onRemoved?: () => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get(`/api/users/${username}/${type}`)
      .then((r) => setUsers(r.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, username, type]);

  async function remove(u: any) {
    await api.post(`/api/users/${u.username}/remove-follower`).catch(() => {});
    setUsers((us) => us.filter((x) => x.id !== u.id));
    onRemoved?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={type === "followers" ? "Followers" : "Following"} className="sm:max-w-md h-[70vh]">
      <div className="p-2">
        {loading ? (
          <div className="grid place-items-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title={type === "followers" ? "No followers yet" : "Not following anyone"} />
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Link href={`/${u.username}`} onClick={onClose}>
                <Avatar src={u.avatar} name={u.displayName} size={44} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/${u.username}`} onClick={onClose} className="flex items-center gap-1 text-sm font-semibold hover:underline">
                  <span className="truncate">{u.username}</span> {u.isVerified && <VerifiedBadge size={12} />}
                </Link>
                <p className="truncate text-xs text-faint">{u.displayName}</p>
              </div>
              {!u.isSelf && (
                type === "followers" && isOwnProfile ? (
                  <Button size="sm" variant="subtle" onClick={() => remove(u)}>Remove</Button>
                ) : (
                  <FollowButton username={u.username} initialFollowing={u.isFollowing} isPrivate={u.isPrivate} />
                )
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
