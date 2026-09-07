"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ auth?: string }>({});
  const [isPending, setIsPending] = useState(false);

  const message = searchParams.get("message");
  const errorParam = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setErrors({});
    setIsPending(true);

    const authError = await signIn(formData);
    if (authError) {
      setErrors({ auth: authError.message });
      setIsPending(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F3F6EA] sm:grid-cols-2">
      {/* Left panel: brand / testimonial */}
      <div className="relative hidden min-h-[480px] overflow-hidden bg-[#0C3B1E] sm:flex">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 15% 10%, rgba(184,222,111,.22) 0%, rgba(12,59,30,0) 45%), linear-gradient(160deg, #0C3B1E 0%, #123f22 46%, #0C3B1E 100%)",
          }}
        />
        <div className="relative z-10 flex h-full w-full flex-col justify-between gap-11 p-8 lg:p-12">
          <Link href="/" className="flex w-max items-center">
            <Image
              src="/island-echoes-icon.svg"
              alt="Island Echoes Health"
              width={64}
              height={64}
              className="brightness-0 invert"
            />
          </Link>

          <div className="max-w-[430px]">
            <p
              className="mb-1 text-3xl leading-tight text-[#B8DE6F] lg:text-4xl"
              style={{ fontFamily: "var(--font-kaushan), cursive" }}
            >
              Better Care.
            </p>
            <h2 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-[#F7FBF0] lg:text-4xl">
              Together.
            </h2>
            <p className="mb-6 text-[15.5px] leading-relaxed text-[#F2F7EAD9]">
              &ldquo;For the first time, I knew what was happening every day
              &mdash; and so did she.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 border-[#B8DE6F99] bg-[#B8DE6F26] text-sm font-semibold text-[#B8DE6F]">
                M
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-[#F7FBF0]">
                  Marisol A.
                </p>
                <p className="text-xs text-[#F2F7EAA6]">
                  Daughter and caregiver, Saint Lucia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          <p className="mb-3.5 inline-flex rounded-full bg-[#E7EDDA] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4C7A32]">
            Log in
          </p>
          <h1 className="mb-2.5 text-3xl font-bold tracking-tight text-[#0C3B1E] sm:text-4xl">
            Welcome back.
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-[#4A5A44]">
            Your care circle is right where you left it.
          </p>

          {message === "signed_out" && (
            <p className="mb-6 rounded-lg bg-[#E6E15A]/20 p-3 text-sm text-[#0C3B1E]">
              You&apos;ve been signed out.
            </p>
          )}
          {errorParam === "invalid_confirmation" && (
            <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              Invalid or expired confirmation link. Please try again.
            </p>
          )}
          {errors.auth && (
            <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errors.auth}
            </p>
          )}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                Email
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                  Password
                </span>
                <Link
                  href="/auth/forgot-password?from=login"
                  className="whitespace-nowrap text-[12.5px] font-medium text-[#3C6B2A] hover:text-[#0C3B1E]"
                >
                  Forgot password?
                </Link>
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex-none rounded-md px-2 py-1.5 text-[12.5px] font-semibold text-[#4C7A32]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            <label className="my-1 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="keepSignedIn"
                className="h-[17px] w-[17px] accent-[#0C3B1E]"
              />
              <span className="text-[13.5px] text-[#4A5A44]">
                Keep me signed in on this device
              </span>
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0C3B1E] py-4 text-[15.5px] font-semibold text-[#F7FBF0] shadow-[0_18px_34px_-18px_rgba(12,59,30,.8)] transition hover:-translate-y-0.5 hover:bg-[#12482A] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending ? "Signing in…" : (
                <>
                  Log in <span className="text-base">&rarr;</span>
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3.5">
            <span className="h-px flex-1 bg-[#0C3B1E24]" />
            <span className="text-xs uppercase tracking-[0.14em] text-[#7A8B72]">
              or
            </span>
            <span className="h-px flex-1 bg-[#0C3B1E24]" />
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="w-full cursor-not-allowed rounded-full border-[1.5px] border-[#0C3B1E2E] bg-white py-3.5 text-[14.5px] font-medium text-[#0C3B1E80]"
            >
              Continue with your clinic SSO
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[#4C7A32]">
                Coming soon
              </span>
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="w-full cursor-not-allowed rounded-full border-[1.5px] border-[#0C3B1E2E] bg-white py-3.5 text-[14.5px] font-medium text-[#0C3B1E80]"
            >
              Use a one-time code by SMS
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[#4C7A32]">
                Coming soon
              </span>
            </button>
          </div>

          <p className="mt-7 text-sm text-[#4A5A44]">
            New to Island Echoes Health?{" "}
            <Link href="/user" className="font-semibold text-[#3C6B2A] hover:text-[#0C3B1E]">
              Create an account
            </Link>
          </p>
          <p className="mt-3.5 text-[12.5px] leading-relaxed text-[#7A8B72]">
            Protected health information stays encrypted end to end.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6EA]" />}>
      <LoginForm />
    </Suspense>
  );
}
