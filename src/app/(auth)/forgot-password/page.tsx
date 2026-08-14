"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { api } from "@/lib/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await api.post("/api/auth/forgot-password", { email }).catch(() => ({}));
    setDevLink(res?.devLink ?? null);
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
          <MailCheck size={26} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          If an account exists for <span className="text-text">{email}</span>, we&apos;ve sent a link to reset
          your password.
        </p>
        {devLink && (
          <a
            href={devLink}
            className="mt-4 block truncate rounded-xl border border-border bg-surface p-3 text-xs text-accent hover:underline"
          >
            Dev link: {devLink}
          </a>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold">Reset your password</h2>
      <p className="mt-1 text-sm text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
      <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-accent hover:underline">
        Back to login
      </Link>
    </div>
  );
}
