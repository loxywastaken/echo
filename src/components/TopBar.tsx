"use client";

import Link from "next/link";
import { Heart, MessageCircle, Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export function TopBar({ onSearch }: { onSearch: () => void }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border glass px-4 py-3 md:hidden">
      <Link href="/">
        <Logo size={26} />
      </Link>
      <div className="flex items-center gap-1.5">
        <button onClick={onSearch} className="press grid h-9 w-9 place-items-center rounded-full text-text" aria-label="Search">
          <Search size={22} />
        </button>
        <Link href="/notifications" className="press relative grid h-9 w-9 place-items-center rounded-full text-text" aria-label="Notifications">
          <Heart size={22} />
          {!!user?.unreadNotifs && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-gradient" />
          )}
        </Link>
        <Link href="/messages" className="press grid h-9 w-9 place-items-center rounded-full text-text" aria-label="Messages">
          <MessageCircle size={22} />
        </Link>
      </div>
    </header>
  );
}
