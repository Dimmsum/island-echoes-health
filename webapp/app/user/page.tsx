"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { PhotoPlaceholder } from "@/app/components/landing/PhotoPlaceholder";
import { handleUserAuth } from "./actions";

const CHECKLIST = [
  "Invite family with a link — no app store trip needed.",
  "Plain-language summaries after every visit.",
  "Works on low bandwidth, wherever you are.",
];

function passwordStrength(password: string) {
  if (password.length === 0) return 0;
  if (password.length < 8) return 1;
  const varied = /[a-z]/.test(password) && /[A-Z0-9]/.test(password);
  return varied && password.length >= 12 ? 3 : 2;
}

function UserAuthForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; terms?: string; auth?: string }>({});
  const [isPending, setIsPending] = useState(false);

  const message = searchParams.get("message");
  const errorParam = searchParams.get("error");
  const strength = useMemo(() => passwordStrength(password), [password]);

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const pwd = formData.get("password") as string;
    const agreed = formData.get("terms") === "on";

    const newErrors: { password?: string; terms?: string } = {};
    const pwdError = validatePassword(pwd);
    if (pwdError) newErrors.password = pwdError;
    if (!agreed) newErrors.terms = "Please agree to the Terms and Privacy Notice";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsPending(true);

    const authError = await handleUserAuth(formData);
    if (authError) {
      setErrors({ auth: authError.message });
      setIsPending(false);
    }
  };

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-[#F3F6EA] sm:grid-cols-2">
      {/* Left panel: photo / brand */}
      <div className="relative hidden overflow-hidden bg-[#0C3B1E] sm:flex">
        <div className="absolute inset-0">
          <PhotoPlaceholder tone="dark" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(9,45,23,.9) 0%, rgba(10,50,26,.56) 46%, rgba(12,59,30,.9) 100%)",
          }}
        />
        <div className="relative z-10 flex h-full w-full flex-col items-start justify-between gap-11 p-8 lg:p-12">
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
              Join your care circle in a couple of minutes. One private
              thread for the whole family and the team looking after them.
            </p>
            <div className="grid gap-3.5">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[#B8DE6F33] text-[11px] text-[#B8DE6F]">
                    ✓
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-[#F2F7EAE0]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex h-full items-start justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          <p className="mb-3.5 inline-flex rounded-full bg-[#E7EDDA] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4C7A32]">
            Patients &amp; families
          </p>
          <h1 className="mb-2.5 text-3xl font-bold tracking-tight text-[#0C3B1E] sm:text-4xl">
            Start your care circle.
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-[#4A5A44]">
            Two minutes now, and the whole family stays in the loop.
          </p>

          {message === "check_email" && (
            <p className="mb-6 rounded-lg bg-[#E6E15A]/20 p-3 text-sm text-[#0C3B1E]">
              Check your email for a confirmation link to complete sign up.
            </p>
          )}
          {errorParam === "invalid_confirmation" && (
            <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              Invalid or expired confirmation link. Please try signing up again.
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
                Full name
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Marisol Alvarez"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

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
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                Password
              </span>
              <span
                className={`flex items-center gap-2.5 rounded-2xl border-[1.5px] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)] ${
                  errors.password ? "border-red-400" : "border-[#0C3B1E29]"
                }`}
              >
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
              )}
              <span className="mt-2.5 flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{
                      background: i <= strength ? "#4C7A32" : "rgba(12,59,30,.14)",
                    }}
                  />
                ))}
              </span>
            </label>

            <label className="my-1 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                name="terms"
                className="mt-0.5 h-[17px] w-[17px] flex-none accent-[#0C3B1E]"
              />
              <span className="text-[13.5px] leading-relaxed text-[#4A5A44]">
                I agree to the <a href="#">Terms</a> and the{" "}
                <a href="#">Privacy Notice</a>, including how my health
                information is shared with my care team.
              </span>
            </label>
            {errors.terms && (
              <p className="-mt-2.5 text-xs text-red-600">{errors.terms}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0C3B1E] py-4 text-[15.5px] font-semibold text-[#F7FBF0] shadow-[0_18px_34px_-18px_rgba(12,59,30,.8)] transition hover:-translate-y-0.5 hover:bg-[#12482A] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending ? "Creating account…" : (
                <>
                  Create account <span className="text-base">&rarr;</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-sm text-[#4A5A44]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#3C6B2A] hover:text-[#0C3B1E]">
              Log in
            </Link>
          </p>
          <p className="mt-3.5 text-[12.5px] leading-relaxed text-[#7A8B72]">
            Are you a clinician or staff member?{" "}
            <Link href="/clinician" className="font-semibold text-[#3C6B2A] hover:text-[#0C3B1E]">
              Register in the staff portal
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UserAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6EA]" />}>
      <UserAuthForm />
    </Suspense>
  );
}
