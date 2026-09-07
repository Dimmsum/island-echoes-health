"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { PhotoPlaceholder } from "@/app/components/landing/PhotoPlaceholder";
import { submitClinicianRequest } from "./actions";

const CHECKLIST = [
  "Structured updates that fit the way your team already works.",
  "Fewer repeated questions from families between visits.",
  "One record of communication across the whole care journey.",
];

function ClinicianAuthForm() {
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<{ auth?: string }>({});
  const [isPending, setIsPending] = useState(false);
  const [fileName, setFileName] = useState("no file selected");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const message = searchParams.get("message");
  const errorParam = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setIsPending(true);
    const authError = await submitClinicianRequest(formData);
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
              Access is verified with your organization before it is
              granted, so every thread stays inside your clinic&rsquo;s
              circle of care.
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
            Clinician &amp; staff portal
          </p>
          <h1 className="mb-2.5 text-3xl font-bold tracking-tight text-[#0C3B1E] sm:text-4xl">
            Create Account
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-[#4A5A44]">
            Register for the clinician and staff portal.
          </p>

          {message === "request_submitted" && (
            <p className="mb-6 rounded-lg bg-[#E6E15A]/20 p-3 text-sm text-[#0C3B1E]">
              Your request has been submitted. An administrator will review
              it; you&apos;ll receive an email when your account is
              approved.
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
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                License number<span className="text-[#4C7A32]"> *</span>
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="license_number"
                  type="text"
                  required
                  placeholder="e.g. MD-12345"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                Specialty<span className="text-[#4C7A32]"> *</span>
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="specialty"
                  type="text"
                  required
                  placeholder="e.g. Family Medicine, Psychiatry"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                Institution / clinic name
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="institution_or_clinic_name"
                  type="text"
                  placeholder="Optional"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

            <div>
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                Medical license image<span className="text-[#4C7A32]"> *</span>
              </span>
              <span className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white p-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-none rounded-[10px] bg-[#E7EFD9] px-5 py-2.5 text-sm font-semibold text-[#1E5C2F] transition hover:bg-[#D8E8C6]"
                >
                  Choose File
                </button>
                <span className="min-w-0 flex-1 truncate text-[14.5px] text-[#4A5A44]">
                  {fileName}
                </span>
              </span>
              <input
                ref={fileInputRef}
                name="license_image"
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) =>
                  setFileName(e.target.files?.[0]?.name || "no file selected")
                }
                className="sr-only"
              />
              <p className="mt-2.5 text-[12.5px] text-[#7A8B72]">
                JPEG, PNG, WebP or PDF, max 5 MB
              </p>
            </div>

            <p className="rounded-2xl border border-[#0C3B1E1A] bg-[#EFF4E4] p-3.5 text-sm leading-relaxed text-[#3C4F3C]">
              You&apos;ll set your password after your account is approved.
            </p>

            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold tracking-[0.04em] text-[#3C4F3C]">
                Work email
              </span>
              <span className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-[#0C3B1E29] bg-white px-4 transition focus-within:border-[#4C7A32] focus-within:shadow-[0_0_0_4px_rgba(184,222,111,.32)]">
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@clinic.org"
                  className="min-w-0 flex-1 border-0 bg-transparent py-[15px] text-[15px] text-[#0C3B1E] outline-none placeholder:text-[#0C3B1E80]"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1E5C2F] py-4 text-[15.5px] font-semibold text-[#F7FBF0] shadow-[0_18px_34px_-18px_rgba(12,59,30,.8)] transition hover:-translate-y-0.5 hover:bg-[#12482A] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending ? "Please wait…" : "Create Account"}
            </button>
          </form>

          <p className="mt-7 text-sm text-[#4A5A44]">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-[#3C6B2A] hover:text-[#0C3B1E]">
              Log in
            </Link>
          </p>
          <p className="mt-3.5 text-[12.5px] leading-relaxed text-[#7A8B72]">
            Patient or family member?{" "}
            <Link href="/user" className="font-semibold text-[#3C6B2A] hover:text-[#0C3B1E]">
              Create a user account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClinicianAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6EA]" />}>
      <ClinicianAuthForm />
    </Suspense>
  );
}
