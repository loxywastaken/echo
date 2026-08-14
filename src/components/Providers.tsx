"use client";

import { AuthProvider, type Me } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({
  initialUser,
  initialTheme = "dark",
  children,
}: {
  initialUser: Me | null;
  initialTheme?: "dark" | "light" | "system";
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider initial={initialTheme}>
      <AuthProvider initialUser={initialUser}>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
