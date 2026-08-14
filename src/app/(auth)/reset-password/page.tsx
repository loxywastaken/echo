"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      toast("Password updated — please log in", "success");
      router.push("/login");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not reset password", "error");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold">Invalid link</h2>
        <p className="mt-2 text-sm text-muted">This reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold">Choose a new password</h2>
      <p className="mt-1 text-sm text-muted">Make it at least 8 characters.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
