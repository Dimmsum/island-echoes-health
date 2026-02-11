"use client";

import { useTransition, useState } from "react";
import {
  approveClinicianRequest,
  rejectClinicianRequest,
} from "./actions";

export type PendingRequest = {
  id: string;
  email: string | null;
  full_name: string | null;
  license_number: string | null;
  specialty: string | null;
  institution_or_clinic_name: string | null;
  license_image_path: string | null;
  created_at: string | null;
  license_image_url?: string | null;
};

export function PendingRequestsTable({
  requests,
}: {
  requests: PendingRequest[];
}) {
  const [isPending, startTransition] = useTransition();
  const [actingId, setActingId] = useState<string | null>(null);

  function handleApprove(id: string) {
    setActingId(id);
    startTransition(async () => {
      const result = await approveClinicianRequest(id);
      setActingId(null);
      if (result.error) {
        alert(result.error);
      }
    });
  }

  function handleReject(id: string) {
    setActingId(id);
    startTransition(async () => {
      const result = await rejectClinicianRequest(id);
      setActingId(null);
      if (result.error) {
        alert(result.error);
      }
    });
  }

  if (requests.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-slate-500">
        No pending requests.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              License
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Specialty
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              Submitted
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((row) => (
            <tr key={row.id} className="transition hover:bg-slate-50/50">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                {row.full_name ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {row.email ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                <span className="block">{row.license_number ?? "—"}</span>
                {row.institution_or_clinic_name ? (
                  <span className="mt-1 block text-xs text-slate-500">
                    {row.institution_or_clinic_name}
                  </span>
                ) : null}
                {row.license_image_url ? (
                  <a
                    href={row.license_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-[#1F5F2E] hover:underline"
                  >
                    View license
                  </a>
                ) : null}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {row.specialty ?? "—"}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {row.created_at
                  ? new Date(row.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isPending && actingId === row.id}
                    onClick={() => handleApprove(row.id)}
                    className="rounded-lg bg-[#1F5F2E] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#174622] disabled:opacity-70"
                  >
                    {isPending && actingId === row.id ? "..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending && actingId === row.id}
                    onClick={() => handleReject(row.id)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-70"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
