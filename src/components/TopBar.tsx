"use client";

import Link from "next/link";
import { Heart, MessageCircle, Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { useAuth } from "@/context/AuthContext";

export function TopBar({ onSearch }: { onSearch: () => void }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/80 bg-surface/95 px-3 py-2 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        {user && <AccountSwitcher compact />}
        <Link href="/" className="press">
          <Logo size={26} />
        </Link>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onSearch}
          className="press grid h-9 w-9 place-items-center rounded-full text-text hover:bg-surface-2"
          aria-label="Search"
        >
          <Search size={21} />
        </button>
        <Link
          href="/notifications"
          className="press relative grid h-9 w-9 place-items-center rounded-full text-text hover:bg-surface-2"
          aria-label="Notifications"
        >
          <Heart size={21} />
          {!!user?.unreadNotifs && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white" />
          )}
        </Link>
        <Link
          href="/messages"
          className="press grid h-9 w-9 place-items-center rounded-full text-text hover:bg-surface-2"
          aria-label="Messages"
        >
          <MessageCircle size={21} />
        </Link>
      </div>
    </header>
  );
}
