"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/misc";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { identifier, password, rememberMe: remember });
      await refresh();
      if (res.suspended) toast("Your account is suspended — some actions are limited.", "info");
      router.push(params.get("next") || "/");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not sign in", "error");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold">Welcome back</h2>
      <p className="mt-1 text-sm text-muted">Sign in to continue to Vortex.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <Input
          label="Email or username"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted">
            <Toggle checked={remember} onChange={setRemember} label="Remember me" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to Vortex?{" "}
        <Link href="/signup" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface/60 p-3 text-center text-xs text-faint">
        Demo login — <span className="text-muted">maya</span> / <span className="text-muted">password123</span>
        <br />
        Admin — <span className="text-muted">admin</span> / <span className="text-muted">password123</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
