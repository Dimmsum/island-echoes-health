"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addAppointmentNote,
  addAppointmentService,
  recordPatientMetrics,
} from "../../clinician-actions";
import { CustomInput } from "@/app/components/CustomInput";
import { CustomTextArea } from "@/app/components/CustomTextArea";
import { CustomSelect, type CustomSelectOption } from "@/app/components/CustomSelect";

type Note = { id: string; content: string; created_at: string };
type Service = { id: string; service_type: string; details: string | null; created_at: string };

const SERVICE_TYPES = [
  "vitals",
  "chronic_lab",
  "wellness_check",
  "follow_up",
  "coordination",
] as const;

const SERVICE_TYPE_OPTIONS: CustomSelectOption<(typeof SERVICE_TYPES)[number]>[] = SERVICE_TYPES.map((t) => ({
  value: t,
  label: t.replace(/_/g, " "),
}));

const ADHERENCE_OPTIONS: CustomSelectOption<"good" | "fair" | "poor" | "">[] = [
  { value: "", label: "—" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

type Props = {
  appointmentId: string;
  patientId: string;
  notes: Note[];
  services: Service[];
  variant?: "light" | "dark";
};

const sectionCardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

const sectionTitleClass = "text-base font-semibold text-slate-900";

export function AppointmentDetailClient({
  appointmentId,
  patientId,
  notes,
  services,
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
    <div className="space-y-8">
      {/* Notes */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>Notes</h2>
        {notes.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
              >
                <p className="whitespace-pre-wrap">{n.content}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No notes yet.</p>
        )}
        <form onSubmit={handleAddNote} className="mt-6">
          <CustomTextArea
            label="Add a note"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Visit summary, next steps…"
            rows={4}
            containerClassName="mb-4"
          />
          <button
            type="submit"
            disabled={pending !== null}
            className="rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23] disabled:opacity-50"
          >
            {pending === "note" ? "Adding…" : "Add note"}
          </button>
        </form>
      </section>

      {/* Services used */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>Services used</h2>
        {services.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-700"
              >
                <span className="capitalize">{s.service_type.replace(/_/g, " ")}</span>
                {s.details && <span className="text-slate-500">{s.details}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No services recorded yet.</p>
        )}
        <form onSubmit={handleAddService} className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-[200px]">
              <CustomSelect
                label="Service type"
                value={serviceType}
                onChange={setServiceType}
                options={SERVICE_TYPE_OPTIONS}
                aria-label="Service type"
              />
            </div>
            <div className="min-w-0 flex-1">
              <CustomInput
                label="Details (optional)"
                type="text"
                value={serviceDetails}
                onChange={(e) => setServiceDetails(e.target.value)}
                placeholder="e.g. blood draw, follow-up in 2 weeks"
              />
            </div>
            <button
              type="submit"
              disabled={pending !== null}
              className="shrink-0 rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23] disabled:opacity-50"
            >
              {pending === "service" ? "Adding…" : "Add service"}
            </button>
          </div>
        </form>
      </section>

      {/* Record metrics */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>Record metrics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Blood pressure, weight, A1C, and medication adherence for this visit.
        </p>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleRecordMetrics} className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <CustomInput
              label="BP systolic"
              type="number"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(e.target.value)}
              placeholder="120"
              min={1}
              max={300}
            />
            <CustomInput
              label="BP diastolic"
              type="number"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(e.target.value)}
              placeholder="80"
              min={1}
              max={200}
            />
            <CustomInput
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="70"
            />
            <CustomInput
              label="A1C"
              type="number"
              step="0.1"
              value={a1c}
              onChange={(e) => setA1c(e.target.value)}
              placeholder="5.7"
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <CustomSelect
                label="Medication adherence"
                value={adherence}
                onChange={setAdherence}
                options={ADHERENCE_OPTIONS}
                placeholder="—"
                aria-label="Medication adherence"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={pending !== null}
              className="rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23] disabled:opacity-50"
            >
              {pending === "metrics" ? "Saving…" : "Save metrics"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
