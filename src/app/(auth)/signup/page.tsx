"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState<{ state: "idle" | "checking" | "ok" | "bad"; message?: string }>({
    state: "idle",
  });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Debounced username availability check.
  useEffect(() => {
    const u = form.username.trim();
    setCheck({ state: u.length >= 3 ? "checking" : "idle" });
    clearTimeout(timer.current);
    if (u.length < 3) return;
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/auth/check-username?username=${encodeURIComponent(u)}`);
        setCheck({ state: res.available ? "ok" : "bad", message: res.message });
      } catch {
        setCheck({ state: "idle" });
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [form.username]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (check.state === "bad") return toast("Please choose an available username", "error");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/signup", form);
      await refresh();
      toast("Welcome to Vortex! 🎉", "success");
      if (res.verifyLink) console.log("[echo] Verify link:", res.verifyLink);
      router.push("/");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create account", "error");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold">Create your account</h2>
      <p className="mt-1 text-sm text-muted">It only takes a minute.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <Input label="Name" value={form.displayName} onChange={set("displayName")} placeholder="Maya Chen" required />
        <div className="relative">
          <Input
            label="Username"
            value={form.username}
            onChange={set("username")}
            placeholder="mayachen"
            autoCapitalize="none"
            required
          />
          <span className="pointer-events-none absolute right-3 top-[2.35rem]">
            {check.state === "checking" && <Loader2 size={16} className="animate-spin text-faint" />}
            {check.state === "ok" && <Check size={16} className="text-success" />}
            {check.state === "bad" && <X size={16} className="text-danger" />}
          </span>
          {check.message && (
            <span className={"mt-1 block text-xs " + (check.state === "ok" ? "text-success" : "text-danger")}>
              {check.message}
            </span>
          )}
        </div>
        <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder="At least 8 characters"
          hint="Use 8+ characters."
          required
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-faint">
        By joining you agree to our{" "}
        <Link href="/guidelines" className="text-muted hover:underline">
          Community Guidelines
        </Link>
        .
      </p>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
