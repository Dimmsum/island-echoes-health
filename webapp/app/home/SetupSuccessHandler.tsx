"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { attachPaymentMethodAfterSetup } from "./actions";

type Props = {
  sessionId: string;
};

export function SetupSuccessHandler({ sessionId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await attachPaymentMethodAfterSetup(sessionId);
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setStatus("success");
      window.history.replaceState({}, "", "/home");
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  if (status === "pending") {
    return (
      <div className="rounded-xl border border-[#1F5F2E]/20 bg-[#E6E15A]/10 p-5">
        <p className="text-sm font-medium text-slate-700">
          Completing payment setup…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1F5F2E]/20 bg-[#E6E15A]/20 p-5">
      <p className="text-sm font-medium text-[#1F5F2E]">
        Request sent. The patient will receive a consent request (in-app or when they sign up). You&apos;ll be notified when they respond.
      </p>
    </div>
  );
}
