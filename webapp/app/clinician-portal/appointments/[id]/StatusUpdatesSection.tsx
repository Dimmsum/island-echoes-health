"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomTextArea } from "../../../components/CustomTextArea";
import { createStatusUpdate } from "../../status-update-actions";
import type {
  StatusUpdate,
  StatusUpdateVisibility,
} from "../../status-update-types";

type Props = {
  patientId: string;
  statusUpdates: StatusUpdate[];
};

function visibilityBadge(visibility: StatusUpdateVisibility) {
  switch (visibility) {
    case "sponsor_only":
      return "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20";
    case "patient_only":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    default:
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
  }
}

function visibilityLabel(visibility: StatusUpdateVisibility) {
  switch (visibility) {
    case "sponsor_only":
      return "Family only";
    case "patient_only":
      return "Patient only";
    default:
      return "Everyone";
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StatusUpdatesSection({ patientId, statusUpdates }: Props) {
  const router = useRouter();
  const [statusText, setStatusText] = useState("");
  const [visibility, setVisibility] = useState<StatusUpdateVisibility>("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!statusText.trim()) {
      setError("An update message is required.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await createStatusUpdate({
      patientId,
      statusText: statusText.trim(),
      visibility,
    });
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setStatusText("");
      setVisibility("all");
      router.refresh();
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Status updates</h2>
      <p className="mt-1 text-sm text-slate-500">
        Share progress with the patient and their family sponsors.
      </p>

      {statusUpdates.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {statusUpdates.map((u) => (
            <li
              key={u.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {formatDateTime(u.createdAt)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${visibilityBadge(u.visibility)}`}
                >
                  {visibilityLabel(u.visibility)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {u.statusText}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No status updates yet.</p>
      )}

      <form onSubmit={handleCreate} className="mt-6 space-y-4">
        <CustomTextArea
          label="New update"
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          placeholder="What's the latest on this patient…"
          rows={3}
        />
        <div>
          <label
            htmlFor="status-update-visibility"
            className="block text-xs font-medium uppercase tracking-wider text-slate-500"
          >
            Visible to
          </label>
          <select
            id="status-update-visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as StatusUpdateVisibility)
            }
            className="mt-1.5 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
          >
            <option value="all">Everyone (patient &amp; family)</option>
            <option value="sponsor_only">Family sponsors only</option>
            <option value="patient_only">Patient only</option>
          </select>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23] disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post update"}
        </button>
      </form>
    </section>
  );
}
