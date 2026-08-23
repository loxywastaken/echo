"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Clapperboard,
  MessageCircle,
  Heart,
  PlusSquare,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Sidebar({ onCreate, onSearch }: { onCreate: () => void; onSearch: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", action: onSearch },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Clapperboard, label: "Clips", href: "/clips" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Heart, label: "Notifications", href: "/notifications", badge: user?.unreadNotifs },
    { icon: PlusSquare, label: "Create", action: onCreate },
  ];

  const isActive = (href?: string) =>
    href && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col border-r border-border bg-surface/40 px-3 py-5 md:flex xl:w-64">
      <Link href="/" className="mb-6 flex items-center px-2">
        <span className="hidden xl:block">
          <Logo size={30} />
        </span>
        <span className="xl:hidden">
          <LogoMark size={30} />
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((it) => {
          const active = isActive(it.href);
          const content = (
            <>
              <span className="relative">
                <it.icon
                  size={24}
                  strokeWidth={active ? 2.6 : 2}
                  className={active ? "text-text" : "text-muted group-hover:text-text"}
                />
                {!!it.badge && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-gradient px-1 text-[10px] font-bold text-white">
                    {it.badge > 9 ? "9+" : it.badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "hidden xl:block",
                  active ? "font-bold text-text" : "font-medium text-muted group-hover:text-text"
                )}
              >
                {it.label}
              </span>
            </>
          );
          const cls = cn(
            "group press flex items-center gap-4 rounded-xl px-3 py-2.5 transition",
            active ? "bg-surface-2 text-text" : "hover:bg-surface-2"
          );
          return it.href ? (
            <Link key={it.label} href={it.href} className={cls}>
              {content}
            </Link>
          ) : (
            <button key={it.label} onClick={it.action} className={cn(cls, "w-full text-left")}>
              {content}
            </button>
          );
        })}

        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="group press mt-1 flex items-center gap-4 rounded-xl px-3 py-2.5 transition hover:bg-surface-2"
          >
            <Shield size={24} className={pathname.startsWith("/admin") ? "text-accent" : "text-muted group-hover:text-text"} />
            <span className="hidden font-medium text-muted group-hover:text-text xl:block">Admin</span>
          </Link>
        )}
      </nav>

      <div className="mt-2 flex flex-col gap-1">
        <Link href="/settings" className="group press flex items-center gap-4 rounded-xl px-3 py-2.5 hover:bg-surface-2">
          <Settings size={24} className="text-muted group-hover:text-text" />
          <span className="hidden font-medium text-muted group-hover:text-text xl:block">Settings</span>
        </Link>
        {user && <AccountSwitcher />}
      </div>
    </aside>
  );
}
