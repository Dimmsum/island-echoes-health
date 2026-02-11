"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    auth?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        setHasSession(!!session);
        setSessionChecked(true);
      });
  }, []);

  useEffect(() => {
    if (sessionChecked && !hasSession) {
      router.replace("/auth/forgot-password");
    }
  }, [sessionChecked, hasSession, router]);

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const newErrors: { password?: string; confirmPassword?: string } = {};
    const pwdError = validatePassword(password);
    if (pwdError) newErrors.password = pwdError;
    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setErrors({ auth: error.message });
      setIsPending(false);
      return;
    }
    router.replace("/home");
    router.refresh();
  };

  if (!sessionChecked || !hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

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
            <Link href="/" className="text-slate-800 hover:text-[#1F5F2E]">
              Back to home
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl px-8 py-12 sm:px-12 sm:py-16">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Set new password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Choose a new password for your account (at least 8 characters).
            </p>

            {errors.auth && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.auth}
              </p>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  New password <span className="text-slate-400">(min 8 characters)</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-[#1F5F2E] focus:ring-[#1F5F2E]"
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`mt-1.5 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                    errors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-[#1F5F2E] focus:ring-[#1F5F2E]"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1F5F2E] focus:ring-[#1F5F2E]"
                />
                <span className="text-sm text-slate-600">Show password</span>
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-full bg-[#1F5F2E] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] disabled:opacity-70"
              >
                {isPending ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
