"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomInput } from "../../../components/CustomInput";
import { createMedication, endMedication } from "../../medication-actions";
import type { Medication } from "../../medication-types";

type Props = {
  patientId: string;
  medications: Medication[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MedicationsSection({ patientId, medications }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [prescribedBy, setPrescribedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("A medication name is required.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await createMedication({
      patientId,
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      frequency: frequency.trim() || undefined,
      prescribedBy: prescribedBy.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setName("");
      setDosage("");
      setFrequency("");
      setPrescribedBy("");
      setNotes("");
      router.refresh();
    }
  }

  async function handleEnd(medicationId: string) {
    setEndingId(medicationId);
    setError(null);
    const result = await endMedication({
      patientId,
      medicationId,
      endedAt: new Date().toISOString().slice(0, 10),
    });
    setEndingId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  const active = medications.filter((m) => m.active);
  const ended = medications.filter((m) => !m.active);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Medications</h2>
      <p className="mt-1 text-sm text-slate-500">
        Visible to the patient and their family sponsors.
      </p>

      {medications.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {[...active, ...ended].map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2.5"
            >
              <div>
                <span className="text-sm font-medium text-slate-900">{m.name}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {[m.dosage, m.frequency].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
              {m.active ? (
                <button
                  type="button"
                  onClick={() => handleEnd(m.id)}
                  disabled={endingId === m.id}
                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  {endingId === m.id ? "Ending…" : "End"}
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  Ended {m.endedAt ? formatDate(m.endedAt) : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No medications recorded yet.</p>
      )}

      <form onSubmit={handleCreate} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Metformin"
          />
          <CustomInput
            label="Dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="500mg"
          />
          <CustomInput
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="Twice daily"
          />
          <CustomInput
            label="Prescribed by (optional)"
            value={prescribedBy}
            onChange={(e) => setPrescribedBy(e.target.value)}
            placeholder="Dr. Osei"
          />
        </div>
        <CustomInput
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Take with food"
        />
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
          {pending ? "Saving…" : "Add"}
        </button>
      </form>
    </section>
  );
}
