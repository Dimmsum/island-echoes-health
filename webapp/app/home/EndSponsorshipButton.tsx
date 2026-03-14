"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSponsorship } from "./actions";

type Props = {
  planId: string;
  label?: string;
  variant?: "outline" | "ghost";
  className?: string;
};

export function EndSponsorshipButton({
  planId,
  label = "Cancel sponsorship",
  variant = "outline",
  className = "",
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function handleClick() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setError(null);
    setPending(true);
    const result = await endSponsorship(planId);
    setPending(false);
    setConfirm(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const baseClass = "rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50";
  const variantClass =
    variant === "ghost"
      ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      : "border border-red-200 bg-white text-red-700 hover:bg-red-50";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`${baseClass} ${variantClass} ${className}`}
      >
        {pending ? "Ending…" : confirm ? "Confirm: stop payments and unlink?" : label}
      </button>
      {confirm && !pending && (
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Keep sponsorship
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
