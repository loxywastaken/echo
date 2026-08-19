"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/misc";
import { FollowButton } from "@/components/FollowButton";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/client";
import { formatCount } from "@/lib/utils";

export function RightRail() {
  const { user, logout } = useAuth();
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/explore").then((r) => setCreators(r.creators || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 py-6">
      {user && (
        <div className="flex items-center gap-3">
          <Link href={`/${user.username}`}>
            <Avatar src={user.avatar} name={user.displayName} size={52} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/${user.username}`} className="block truncate text-sm font-semibold hover:underline">
              {user.username}
            </Link>
            <p className="truncate text-sm text-faint">{user.displayName}</p>
          </div>
          <button onClick={logout} className="text-xs font-semibold text-accent hover:underline">
            Log out
          </button>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted">Suggested for you</span>
          <Link href="/explore" className="text-xs font-medium text-faint hover:text-text">See all</Link>
        </div>
        <div className="space-y-1">
          {creators.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-1.5">
              <Link href={`/${c.username}`}>
                <Avatar src={c.avatar} name={c.displayName} size={40} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/${c.username}`} className="flex items-center gap-1 text-sm font-semibold hover:underline">
                  <span className="truncate">{c.username}</span>
                  {c.isVerified && <VerifiedBadge size={12} type={c.badgeType || "blue"} />}
                </Link>
                <p className="truncate text-xs text-faint">{formatCount(c.followers)} followers</p>
              </div>
              <FollowButton username={c.username} initialFollowing={false} isPrivate={c.isPrivate} />
            </div>
          ))}
          {creators.length === 0 && <p className="py-4 text-xs text-faint">No suggestions yet.</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-faint">
        <Link href="/explore" className="hover:underline">Explore</Link>
        <Link href="/clips" className="hover:underline">Clips</Link>
        <Link href="/guidelines" className="hover:underline">Guidelines</Link>
        <Link href="/settings" className="hover:underline">Settings</Link>
        <span className="mt-2 block w-full text-faint/70">Â© {new Date().getFullYear()} Vortex</span>
      </div>
    </div>
  );
}
