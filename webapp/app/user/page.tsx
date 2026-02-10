"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function UserAuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string | null;

    const newErrors: { password?: string; confirmPassword?: string } = {};
    const pwdError = validatePassword(password);
    if (pwdError) newErrors.password = pwdError;
    if (mode === "signup" && confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // Ready for Supabase integration
    }
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
            <Link href="/" className="text-slate-800 hover:text-[#1F5F2E]">
              Back to home
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/90 p-10 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:max-w-lg sm:p-12">
            <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {mode === "signin" ? "Sign in" : "Create your account"}
            </h1>
            <p className="mt-3 text-center text-sm text-slate-600">
              {mode === "signin"
                ? "Welcome back. Sign in to continue."
                : "Join Island Echoes to stay connected through care."}
            </p>

            <div className="mt-6 flex gap-1 rounded-full bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrors({});
                }}
                className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                  mode === "signin"
                    ? "bg-[#1F5F2E] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrors({});
                }}
                className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-[#1F5F2E] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Sign up
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password {mode === "signup" && <span className="text-slate-400">(min 8 characters)</span>}
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
              {mode === "signup" && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
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
              )}
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
                className="w-full rounded-full bg-[#1F5F2E] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622]"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/90 px-3 text-slate-500">or</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
