"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") as "user" | "clinician" | null;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backHref = from === "clinician" ? "/clinician" : "/user";
  const backLabel = from ? "Back to sign in" : "Back to home";
  const backLink = from ? backHref : "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailValue = (formData.get("email") as string)?.trim();
    if (!emailValue) return;

    setIsPending(true);
    setError(null);
    const baseUrl =
      typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : window.location.origin;
    const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth/confirm?next=/auth/set-new-password`;

    const { error: err } = await createClient().auth.resetPasswordForEmail(emailValue, {
      redirectTo,
    });

    if (err) {
      setError(err.message);
      setIsPending(false);
      return;
    }
    setEmail(emailValue);
    setSubmitted(true);
    setIsPending(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E6E15A]/25 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[40rem] rounded-full bg-[#9CCB4A]/30 blur-3xl" />
        <div className="absolute -left-32 bottom-[-8rem] h-72 w-[36rem] rounded-full bg-[#9CCB4A]/18 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#1F5F2E]/5 to-transparent" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/island-echoes-health.svg"
              alt="Island Echoes Health"
              width={140}
              height={50}
              priority
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-900 sm:gap-6">
            <Link href="/about" className="hover:text-[#1F5F2E]">
              About
            </Link>
            <Link href="/pricing" className="hover:text-[#1F5F2E]">
              Pricing
            </Link>
            <div className="hidden h-6 w-px bg-slate-300/70 sm:block" />
            <Link href={backLink} className="text-slate-800 hover:text-[#1F5F2E]">
              {backLabel}
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl px-8 py-12 sm:px-12 sm:py-16">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Reset your password
            </h1>

            {submitted ? (
              <p className="mt-4 rounded-lg bg-[#E6E15A]/20 p-3 text-sm text-[#1F5F2E]">
                If an account exists for {email ? <strong>{email}</strong> : "this email"}, you&apos;ll
                receive a link to reset your password.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Enter your email and we&apos;ll send you a link to set a new password.
                </p>
                {error && (
                  <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                    {error.toLowerCase().includes("redirect") && (
                      <span className="mt-2 block">
                        Add this URL in Supabase: Authentication → URL Configuration → Redirect
                        URLs.
                      </span>
                    )}
                  </p>
                )}
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-full bg-[#1F5F2E] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] disabled:opacity-70"
                  >
                    {isPending ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              </>
            )}

            <p className="mt-6 text-center">
              <Link
                href={backLink}
                className="text-sm text-[#1F5F2E] hover:underline"
              >
                {from ? "Back to sign in" : "Back to home"}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
