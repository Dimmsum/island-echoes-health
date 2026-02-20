"use client";

import { useState, useRef } from "react";
import { uploadAvatar } from "../actions";

const UserIcon = () => (
  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

type Props = {
  initialAvatarUrl: string | null;
  variant?: "light" | "dark";
};

export function ProfileEditForm({ initialAvatarUrl, variant = "light" }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? null);
  const [pendingAvatar, setPendingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = variant === "dark";

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPendingAvatar(true);
    const formData = new FormData();
    formData.set("avatar", file);
    const result = await uploadAvatar(formData);
    setPendingAvatar(false);
    if (result.error) setError(result.error);
    else if (result.url) setAvatarUrl(result.url);
    e.target.value = "";
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative group">
          <div className={`relative h-32 w-32 overflow-hidden rounded-2xl border-4 transition-all ${
            isDark ? "border-white/20 bg-white/5" : "border-slate-200 bg-slate-100"
          } ${pendingAvatar ? "opacity-60" : ""}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}>
                <UserIcon />
              </div>
            )}
            {pendingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pendingAvatar}
            className={`absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition ${
              isDark
                ? "border-white/20 bg-[#1a1f26] text-white hover:bg-white/10"
                : "border-white bg-[#1F5F2E] text-white hover:bg-[#174622]"
            } disabled:opacity-50`}
          >
            <CameraIcon />
          </button>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            Profile photo
          </h3>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Upload a photo to personalize your profile. JPEG, PNG, WebP or GIF. Max 2 MB.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pendingAvatar}
            className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              isDark
                ? "border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            } disabled:opacity-70`}
          >
            <CameraIcon />
            {pendingAvatar ? "Uploading…" : "Change photo"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={`rounded-xl border p-4 text-sm ${
          isDark
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-red-200 bg-red-50 text-red-600"
        }`}>
          {error}
        </div>
      )}
      {success && (
        <div className={`rounded-xl border p-4 text-sm ${
          isDark
            ? "border-[#1F5F2E]/30 bg-[#1F5F2E]/10 text-[#9CCB4A]"
            : "border-[#1F5F2E]/20 bg-[#E6E15A]/20 text-[#1F5F2E]"
        }`}>
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>Profile updated successfully</span>
          </div>
        </div>
      )}
    </div>
  );
}
