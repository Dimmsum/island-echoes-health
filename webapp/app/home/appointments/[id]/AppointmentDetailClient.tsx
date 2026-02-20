"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addAppointmentNote,
  addAppointmentService,
  recordPatientMetrics,
} from "../../clinician-actions";

type Note = { id: string; content: string; created_at: string };
type Service = { id: string; service_type: string; details: string | null; created_at: string };

const SERVICE_TYPES = [
  "vitals",
  "chronic_lab",
  "wellness_check",
  "follow_up",
  "coordination",
] as const;

type Props = {
  appointmentId: string;
  patientId: string;
  notes: Note[];
  services: Service[];
  variant?: "light" | "dark";
};

const cardClass = (v: "light" | "dark") =>
  v === "dark"
    ? "rounded-xl border border-white/10 bg-white/5 p-5"
    : "rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur";

const headingClass = (v: "light" | "dark") =>
  v === "dark" ? "text-base font-semibold text-white" : "text-lg font-semibold text-slate-900";

const inputClass = (v: "light" | "dark") =>
  v === "dark"
    ? "rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
    : "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]";

const btnClass = (v: "light" | "dark") =>
  v === "dark"
    ? "rounded-xl bg-[#1F5F2E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#174622] disabled:opacity-70"
    : "rounded-full bg-[#1F5F2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#174622] disabled:opacity-70";

export function AppointmentDetailClient({
  appointmentId,
  patientId,
  notes,
  services,
  variant = "light",
}: Props) {
  const router = useRouter();
  const [noteContent, setNoteContent] = useState("");
  const [serviceType, setServiceType] = useState<(typeof SERVICE_TYPES)[number]>("vitals");
  const [serviceDetails, setServiceDetails] = useState("");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [a1c, setA1c] = useState("");
  const [adherence, setAdherence] = useState<"good" | "fair" | "poor" | "">("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setError(null);
    setPending("note");
    const result = await addAppointmentNote(appointmentId, noteContent);
    setPending(null);
    if (result.error) setError(result.error);
    else {
      setNoteContent("");
      router.refresh();
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending("service");
    const result = await addAppointmentService(
      appointmentId,
      serviceType,
      serviceDetails.trim() || undefined
    );
    setPending(null);
    if (result.error) setError(result.error);
    else {
      setServiceDetails("");
      router.refresh();
    }
  }

  async function handleRecordMetrics(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending("metrics");
    const result = await recordPatientMetrics({
      patientId,
      appointmentId,
      bloodPressureSystolic: bpSystolic ? parseInt(bpSystolic, 10) : undefined,
      bloodPressureDiastolic: bpDiastolic ? parseInt(bpDiastolic, 10) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      a1c: a1c ? parseFloat(a1c) : undefined,
      medicationAdherence: adherence || undefined,
    });
    setPending(null);
    if (result.error) setError(result.error);
    else {
      setBpSystolic("");
      setBpDiastolic("");
      setWeightKg("");
      setA1c("");
      setAdherence("");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className={cardClass(variant)}>
        <h2 className={headingClass(variant)}>Notes</h2>
        {notes.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className={variant === "dark" ? "rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300" : "rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-700"}
              >
                {n.content}
                <p className={variant === "dark" ? "mt-1 text-xs text-slate-500" : "mt-1 text-xs text-slate-400"}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={variant === "dark" ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-slate-500"}>No notes yet.</p>
        )}
        <form onSubmit={handleAddNote} className="mt-4">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Visit summary, next steps…"
            rows={3}
            className={`w-full ${inputClass(variant)}`}
          />
          <button type="submit" disabled={pending !== null} className={`mt-2 ${btnClass(variant)}`}>
            {pending === "note" ? "Adding…" : "Add note"}
          </button>
        </form>
      </div>

      <div className={cardClass(variant)}>
        <h2 className={headingClass(variant)}>Services used</h2>
        {services.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {services.map((s) => (
              <li
                key={s.id}
                className={variant === "dark" ? "flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300" : "flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"}
              >
                <span className="capitalize">{s.service_type.replace("_", " ")}</span>
                {s.details && (
                  <span className={variant === "dark" ? "text-slate-500" : "text-slate-500"}>{s.details}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No services recorded yet.</p>
        )}
        <form onSubmit={handleAddService} className="mt-4 flex flex-wrap items-end gap-2">
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as (typeof SERVICE_TYPES)[number])}
            className={inputClass(variant)}
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t} className={variant === "dark" ? "bg-[#1a1f26] text-white" : ""}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={serviceDetails}
            onChange={(e) => setServiceDetails(e.target.value)}
            placeholder="Details (optional)"
            className={inputClass(variant)}
          />
          <button type="submit" disabled={pending !== null} className={btnClass(variant)}>
            {pending === "service" ? "Adding…" : "Add service"}
          </button>
        </form>
      </div>

      <div className={`${cardClass(variant)} lg:col-span-2`}>
        <h2 className={headingClass(variant)}>Record metrics</h2>
        <p className={variant === "dark" ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-600"}>
          Blood pressure, weight, A1C, medication adherence for this visit.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
        <form onSubmit={handleRecordMetrics} className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className={variant === "dark" ? "block text-xs font-medium text-slate-400" : "block text-xs font-medium text-slate-600"}>BP (systolic)</label>
            <input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} placeholder="120" min={1} max={300} className={`mt-1 w-24 ${inputClass(variant)}`} />
          </div>
          <div>
            <label className={variant === "dark" ? "block text-xs font-medium text-slate-400" : "block text-xs font-medium text-slate-600"}>BP (diastolic)</label>
            <input type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} placeholder="80" min={1} max={200} className={`mt-1 w-24 ${inputClass(variant)}`} />
          </div>
          <div>
            <label className={variant === "dark" ? "block text-xs font-medium text-slate-400" : "block text-xs font-medium text-slate-600"}>Weight (kg)</label>
            <input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" className={`mt-1 w-24 ${inputClass(variant)}`} />
          </div>
          <div>
            <label className={variant === "dark" ? "block text-xs font-medium text-slate-400" : "block text-xs font-medium text-slate-600"}>A1C</label>
            <input type="number" step="0.1" value={a1c} onChange={(e) => setA1c(e.target.value)} placeholder="5.7" className={`mt-1 w-24 ${inputClass(variant)}`} />
          </div>
          <div>
            <label className={variant === "dark" ? "block text-xs font-medium text-slate-400" : "block text-xs font-medium text-slate-600"}>Medication adherence</label>
            <select value={adherence} onChange={(e) => setAdherence(e.target.value as "good" | "fair" | "poor" | "")} className={`mt-1 ${inputClass(variant)}`}>
              <option value="">—</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <button type="submit" disabled={pending !== null} className={`self-end ${btnClass(variant)}`}>
            {pending === "metrics" ? "Saving…" : "Save metrics"}
          </button>
        </form>
      </div>
    </div>
  );
}
