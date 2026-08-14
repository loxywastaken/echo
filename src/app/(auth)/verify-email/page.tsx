"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/client";

function Verify() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");

  useEffect(() => {
    if (!token) return setState("bad");
    api
      .post("/api/auth/verify-email", { token })
      .then(() => setState("ok"))
      .catch(() => setState("bad"));
  }, [token]);

  return (
    <div className="animate-fade-in-up text-center">
      {state === "loading" && (
        <>
          <Loader2 size={40} className="mx-auto animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted">Verifying your email…</p>
        </>
      )}
      {state === "ok" && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
            <BadgeCheck size={28} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Email verified</h2>
          <p className="mt-2 text-sm text-muted">Your account is all set.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
            Go to Echo
          </Link>
        </>
      )}
      {state === "bad" && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/15 text-danger">
            <XCircle size={28} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Link expired</h2>
          <p className="mt-2 text-sm text-muted">This verification link is invalid or has already been used.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
            Continue to Echo
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
