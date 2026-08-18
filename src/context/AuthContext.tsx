"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/client";

export type Me = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  badgeType: "blue" | "gold" | "gray";
  isPrivate: boolean;
  emailVerified: boolean;
  theme: "dark" | "light" | "system";
  counts: { posts: number; followers: number; following: number };
  unreadNotifs: number;
};

const AuthContext = createContext<{
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (u: Me | null) => void;
  logout: () => Promise<void>;
}>({ user: null, loading: true, refresh: async () => {}, setUser: () => {}, logout: async () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({
  initialUser = null,
  children,
}: {
  initialUser?: Me | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<Me | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: Me | null }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    // Check if we were switched to another account (server sets the next session)
    try {
      const { user: nextUser } = await api.get<{ user: Me | null }>("/api/auth/me");
      if (nextUser) {
        // Switched to another stored account
        setUser(nextUser);
        window.location.href = "/";
        return;
      }
    } catch { /* no remaining accounts */ }
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
