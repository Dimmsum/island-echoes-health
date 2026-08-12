"use client";

import { useState } from "react";
import { updateProfile } from "../actions";

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

type Props = {
  initialName: string | null;
};

export function EditableDisplayName({ initialName }: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(name);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    const trimmed = draft.trim();
    setPending(true);
    setError(null);
    const result = await updateProfile(trimmed || null);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName(trimmed);
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#EFF6F1] p-2 text-[#1F5F2E]">
          <UserIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Display name
          </p>
          {editing ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={pending}
              autoFocus
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm font-medium text-slate-900 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E] disabled:opacity-60"
              placeholder="Your name"
            />
          ) : (
            <p className="mt-0.5 truncate text-sm font-medium text-slate-900">
              {name || "Not set"}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="text-sm font-semibold text-[#1F5F2E] hover:underline disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="text-sm font-medium text-slate-500 hover:underline disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 text-sm font-semibold text-[#1F5F2E] hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
