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
    <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col border-r border-border bg-surface/50 px-2.5 py-4 md:flex xl:w-60">
      <Link href="/" className="mb-5 flex items-center px-2.5 press">
        <span className="hidden xl:block">
          <Logo size={28} />
        </span>
        <span className="xl:hidden">
          <LogoMark size={28} />
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((it) => {
          const active = isActive(it.href);
          const content = (
            <>
              <span className="relative">
                <it.icon
                  size={23}
                  strokeWidth={active ? 2.6 : 2}
                  className={active ? "text-text" : "text-muted group-hover:text-text"}
                />
                {!!it.badge && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                    {it.badge > 9 ? "9+" : it.badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "hidden xl:block text-[15px]",
                  active ? "font-semibold text-text" : "font-medium text-muted group-hover:text-text"
                )}
              >
                {it.label}
              </span>
            </>
          );
          const cls = cn(
            "group press flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors",
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
            className={cn(
              "group press mt-0.5 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2",
              pathname.startsWith("/admin") && "bg-surface-2"
            )}
          >
            <Shield
              size={23}
              className={pathname.startsWith("/admin") ? "text-text" : "text-muted group-hover:text-text"}
            />
            <span className="hidden font-medium text-muted group-hover:text-text xl:block text-[15px]">
              Admin
            </span>
          </Link>
        )}
      </nav>

      <div className="mt-1.5 flex flex-col gap-0.5">
        <Link
          href="/settings"
          className="group press flex items-center gap-3.5 rounded-xl px-3 py-2.5 hover:bg-surface-2"
        >
          <Settings size={23} className="text-muted group-hover:text-text" />
          <span className="hidden font-medium text-muted group-hover:text-text xl:block text-[15px]">
            Settings
          </span>
        </Link>
        {user && <AccountSwitcher />}
      </div>
    </aside>
  );
}
