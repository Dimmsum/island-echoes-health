"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function AuthConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const next = searchParams.get("next") ?? "/home";
    const code = searchParams.get("code");

    if (code) {
      createClient()
        .auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            return;
          }
          router.replace(next);
          router.refresh();
        })
        .catch(() => setStatus("error"));
      return;
    }

    const hash = window.location.hash?.slice(1);
    if (!hash) {
      setStatus("error");
      return;
    }

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");

    if (access_token && refresh_token) {
      createClient()
        .auth.setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            return;
          }
          router.replace(next);
          router.refresh();
        })
        .catch(() => setStatus("error"));
      return;
    }

    const token_hash = params.get("token_hash");
    if (token_hash && type) {
      createClient()
        .auth.verifyOtp({ token_hash, type: type as "signup" | "recovery" | "invite" | "magiclink" })
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            return;
          }
          router.replace(next);
          router.refresh();
        })
        .catch(() => setStatus("error"));
      return;
    }

    setStatus("error");
  }, [router, searchParams]);

  useEffect(() => {
    if (status === "error") {
      router.replace("/user?error=invalid_confirmation");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-slate-500">Confirming…</p>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      }
    >
      <AuthConfirmHandler />
    </Suspense>
  );
}
