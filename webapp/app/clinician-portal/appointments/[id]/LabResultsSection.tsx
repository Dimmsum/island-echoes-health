"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomInput } from "../../../components/CustomInput";
import { createLabResult } from "../../lab-actions";
import type { LabPanelType, LabResult } from "../../lab-result-types";

type Props = {
  patientId: string;
  labResults: LabResult[];
};

const PANEL_TYPES: LabPanelType[] = ["lipid_panel", "metabolic_panel", "other"];

function panelLabel(type: LabPanelType) {
  switch (type) {
    case "lipid_panel":
      return "Lipid panel";
    case "metabolic_panel":
      return "Metabolic panel";
    default:
      return "Other";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LabResultsSection({ patientId, labResults }: Props) {
  const router = useRouter();
  const [panelType, setPanelType] = useState<LabPanelType>("lipid_panel");
  const [testName, setTestName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [referenceLow, setReferenceLow] = useState("");
  const [referenceHigh, setReferenceHigh] = useState("");
  const [drawnAt, setDrawnAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!testName.trim()) {
      setError("A test name is required.");
      return;
    }
    const numericValue = Number(value);
    if (!value.trim() || Number.isNaN(numericValue)) {
      setError("A numeric value is required.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await createLabResult({
      patientId,
      panelType,
      testName: testName.trim(),
      value: numericValue,
      unit: unit.trim() || undefined,
      referenceLow: referenceLow.trim() ? Number(referenceLow) : undefined,
      referenceHigh: referenceHigh.trim() ? Number(referenceHigh) : undefined,
      drawnAt,
    });
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setTestName("");
      setValue("");
      setUnit("");
      setReferenceLow("");
      setReferenceHigh("");
      router.refresh();
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Lab results</h2>
      <p className="mt-1 text-sm text-slate-500">
        Immutable — corrections are recorded as a new entry.
      </p>

      {labResults.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {labResults.map((l) => (
            <li key={l.id} className="rounded-xl bg-slate-50 px-4 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{l.testName}</span>
                <span className="text-sm text-slate-700">
                  {l.value}
                  {l.unit ? ` ${l.unit}` : ""}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {panelLabel(l.panelType)} · Drawn {formatDate(l.drawnAt)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No lab results recorded yet.</p>
      )}

      <form onSubmit={handleCreate} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="panel-type"
              className="block text-xs font-medium uppercase tracking-wider text-slate-500"
            >
              Panel
            </label>
            <select
              id="panel-type"
              value={panelType}
              onChange={(e) => setPanelType(e.target.value as LabPanelType)}
              className="mt-1.5 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
            >
              {PANEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {panelLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <CustomInput
            label="Test name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="LDL"
          />
          <CustomInput
            label="Drawn on"
            type="date"
            value={drawnAt}
            onChange={(e) => setDrawnAt(e.target.value)}
          />
          <CustomInput
            label="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="110"
          />
          <CustomInput
            label="Unit (optional)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="mg/dL"
          />
          <CustomInput
            label="Reference low (optional)"
            value={referenceLow}
            onChange={(e) => setReferenceLow(e.target.value)}
            placeholder="0"
          />
          <CustomInput
            label="Reference high (optional)"
            value={referenceHigh}
            onChange={(e) => setReferenceHigh(e.target.value)}
            placeholder="130"
          />
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
          {pending ? "Saving…" : "Add"}
        </button>
      </form>
    </section>
  );
}
