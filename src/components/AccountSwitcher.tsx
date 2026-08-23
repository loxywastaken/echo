"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/misc";
import { useAuth, Me } from "@/context/AuthContext";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

type LinkedAccount = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  isVerified: boolean;
  badgeType: "blue" | "gold" | "gray";
  isActive: boolean;
};

export function AccountSwitcher({ compact = false }: { compact?: boolean }) {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch linked accounts when dropdown opens
  const fetchAccounts = useCallback(async () => {
    try {
      const { accounts: accts } = await api.get<{ accounts: LinkedAccount[] }>("/api/auth/accounts");
      setAccounts(accts);
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    if (open) fetchAccounts();
  }, [open, fetchAccounts]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function handleSwitch(targetUserId: string) {
    if (switching) return;
    setSwitching(true);
    try {
      await api.post("/api/auth/switch", { userId: targetUserId });
      await refresh();
      setOpen(false);
      router.refresh();
    } catch {
      // Session expired — remove from list
      setAccounts((prev) => prev.filter((a) => a.userId !== targetUserId));
    } finally {
      setSwitching(false);
    }
  }

  function handleAddAccount() {
    setOpen(false);
    // Navigate to login with a flag that tells it not to clear existing sessions
    router.push("/login?add=1");
  }

  if (!user) return null;

  const hasMultiple = accounts.length > 1;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "press flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2 transition w-full text-left",
          compact && "justify-center"
        )}
        aria-label="Switch account"
      >
        <Avatar src={user.avatar} name={user.displayName} size={compact ? 26 : 30} />
        {!compact && (
          <>
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-sm font-semibold text-text">{user.displayName}</span>
              <span className="block truncate text-xs text-faint">@{user.username}</span>
            </span>
            <ChevronDown
              size={16}
              className={cn(
                "hidden shrink-0 text-faint transition xl:block",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 rounded-2xl border border-border bg-surface shadow-xl animate-fade-in-up",
            compact ? "bottom-full left-0 mb-2 w-64" : "bottom-full left-0 mb-2 w-[calc(100vw-2rem)] min-w-[240px] max-w-[260px] xl:w-[248px]"
          )}
        >
          {/* Accounts list */}
          <div className="max-h-64 overflow-y-auto py-2">
            {accounts.length > 0 ? (
              accounts.map((acct) => (
                <button
                  key={acct.userId}
                  onClick={() => {
                    if (!acct.isActive) handleSwitch(acct.userId);
                    else setOpen(false);
                  }}
                  disabled={switching}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-surface-2",
                    acct.isActive && "bg-surface-2/60",
                    switching && "opacity-50"
                  )}
                >
                  <Avatar src={acct.avatar} name={acct.displayName} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-text">
                        {acct.displayName}
                      </span>
                      {acct.isVerified && (
                        <VerifiedBadge size={14} type={acct.badgeType || "blue"} />
                      )}
                    </span>
                    <span className="block truncate text-xs text-faint">@{acct.username}</span>
                  </span>
                  {acct.isActive && (
                    <Check size={18} className="shrink-0 text-accent" />
                  )}
                </button>
              ))
            ) : (
              /* Single account — show current user */
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Avatar src={user.avatar} name={user.displayName} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">{user.displayName}</span>
                  <span className="block truncate text-xs text-faint">@{user.username}</span>
                </span>
                <Check size={18} className="shrink-0 text-accent" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-border py-1.5">
            <button
              onClick={handleAddAccount}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-text transition hover:bg-surface-2"
            >
              <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-2 border-dashed border-faint/40">
                <Plus size={18} className="text-faint" />
              </span>
              Add account
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-surface-2"
            >
              <span className="grid h-[38px] w-[38px] shrink-0 place-items-center">
                <LogOut size={18} />
              </span>
              Log out{hasMultiple ? ` @${user.username}` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
