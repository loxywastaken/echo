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
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border glass px-2 py-2 md:hidden">
      <Link href="/" className="press grid place-items-center p-2" aria-label="Home">
        <Home size={26} strokeWidth={active("/") ? 2.6 : 2} className={active("/") ? "text-text" : "text-muted"} />
      </Link>
      <Link href="/explore" className="press grid place-items-center p-2" aria-label="Explore">
        <Compass size={26} strokeWidth={active("/explore") ? 2.6 : 2} className={active("/explore") ? "text-text" : "text-muted"} />
      </Link>
      <button onClick={onCreate} className="press grid place-items-center p-2" aria-label="Create">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient text-white shadow-glow">
          <PlusSquare size={22} />
        </span>
      </button>
      <Link href="/clips" className="press grid place-items-center p-2" aria-label="Clips">
        <Clapperboard size={26} strokeWidth={active("/clips") ? 2.6 : 2} className={active("/clips") ? "text-text" : "text-muted"} />
      </Link>
      <Link href={user ? `/${user.username}` : "/login"} className="press grid place-items-center p-1.5" aria-label="Profile">
        <span className={cn("rounded-full", user && active(`/${user.username}`) && "ring-2 ring-accent")}>
          <Avatar src={user?.avatar} name={user?.displayName || "?"} size={28} />
        </span>
      </Link>
    </nav>
  );
}
