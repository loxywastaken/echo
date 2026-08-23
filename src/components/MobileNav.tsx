"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, Clapperboard } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function MobileNav({ onCreate }: { onCreate: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border glass px-1 py-1.5 md:hidden">
      <Link href="/" className={cn("press grid h-12 w-12 place-items-center rounded-xl", active("/") && "bg-surface-2")} aria-label="Home">
        <Home size={24} strokeWidth={active("/") ? 2.6 : 2} className={active("/") ? "text-text" : "text-muted"} />
      </Link>
      <Link href="/explore" className={cn("press grid h-12 w-12 place-items-center rounded-xl", active("/explore") && "bg-surface-2")} aria-label="Explore">
        <Compass size={24} strokeWidth={active("/explore") ? 2.6 : 2} className={active("/explore") ? "text-text" : "text-muted"} />
      </Link>
      <button onClick={onCreate} className="press grid h-12 w-12 place-items-center" aria-label="Create">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient text-white shadow-glow ring-1 ring-white/15">
          <PlusSquare size={20} />
        </span>
      </button>
      <Link href="/clips" className={cn("press grid h-12 w-12 place-items-center rounded-xl", active("/clips") && "bg-surface-2")} aria-label="Clips">
        <Clapperboard size={24} strokeWidth={active("/clips") ? 2.6 : 2} className={active("/clips") ? "text-text" : "text-muted"} />
      </Link>
      <Link href={user ? `/${user.username}` : "/login"} className={cn("press grid h-12 w-12 place-items-center rounded-xl", user && active(`/${user.username}`) && "bg-surface-2")} aria-label="Profile">
        <span className={cn("rounded-full", user && active(`/${user.username}`) && "ring-2 ring-text/80 ring-offset-2 ring-offset-bg")}>
          <Avatar src={user?.avatar} name={user?.displayName || "?"} size={26} />
        </span>
      </Link>
    </nav>
  );
}
