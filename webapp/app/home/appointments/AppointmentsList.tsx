"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createAppointment,
  updateAppointmentStatus,
} from "../clinician-actions";

type Appointment = {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  status: string;
  patient_name: string | null;
  clinician_name: string | null;
};

type Patient = {
  id: string;
  full_name: string | null;
};

type Props = {
  appointments: Appointment[];
  patients: Patient[];
};

export function AppointmentsList({ appointments, patients }: Props) {
  const [creating, setCreating] = useState(false);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const hasPatients = patients.length > 0;
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const result = await createAppointment(patientId, scheduledAt);
    setCreating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setScheduledAt("");
  }

  async function handleStatus(appointmentId: string, status: "completed" | "no_show" | "cancelled") {
    setPendingId(appointmentId);
    setError(null);
    await updateAppointmentStatus(appointmentId, status);
    setPendingId(null);
  }

  const scheduled = appointments.filter((a) => a.status === "scheduled");
  const pastOrCancelled = appointments.filter((a) => a.status !== "scheduled");

  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">Create appointment</h2>
        {!hasPatients ? (
          <p className="mt-4 text-sm text-slate-500">
            No patients with active plans yet. When sponsors purchase plans and patients accept, they will appear here.
          </p>
        ) : (
        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="patient" className="block text-sm font-medium text-slate-700">
              Patient
            </label>
            <select
              id="patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="mt-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-slate-700">
              Date & time
            </label>
            <input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="mt-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-[#1F5F2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#174622] disabled:opacity-70"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming & past</h2>
        {appointments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No appointments yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="pb-2 pr-4">Patient</th>
                  <th className="pb-2 pr-4">Clinician</th>
                  <th className="pb-2 pr-4">Scheduled</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {apt.patient_name ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {apt.clinician_name ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {new Date(apt.scheduled_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 capitalize text-slate-600">
                      {apt.status}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/home/appointments/${apt.id}`}
                        className="mr-2 text-[#1F5F2E] hover:underline"
                      >
                        Details
                      </Link>
                      {apt.status === "scheduled" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatus(apt.id, "completed")}
                            disabled={pendingId !== null}
                            className="mr-2 text-green-700 hover:underline disabled:opacity-70"
                          >
                            {pendingId === apt.id ? "…" : "Completed"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatus(apt.id, "no_show")}
                            disabled={pendingId !== null}
                            className="mr-2 text-amber-700 hover:underline disabled:opacity-70"
                          >
                            No-show
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatus(apt.id, "cancelled")}
                            disabled={pendingId !== null}
                            className="text-red-600 hover:underline disabled:opacity-70"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
