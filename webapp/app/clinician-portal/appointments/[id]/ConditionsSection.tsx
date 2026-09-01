"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomInput } from "../../../components/CustomInput";
import { createCondition } from "../../condition-actions";
import type { ConditionType, PatientCondition } from "../../condition-types";

type Props = {
  patientId: string;
  conditions: PatientCondition[];
};

function typeBadge(type: ConditionType) {
  return type === "allergy"
    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
    : "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10";
}

function typeLabel(type: ConditionType) {
  return type === "allergy" ? "Allergy" : "Condition";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ConditionsSection({ patientId, conditions }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ConditionType>("condition");
  const [severity, setSeverity] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError("A label is required.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await createCondition({
      patientId,
      label: label.trim(),
      type,
      severity: severity.trim() || undefined,
    });
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setLabel("");
      setType("condition");
      setSeverity("");
      router.refresh();
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Conditions & allergies</h2>
      <p className="mt-1 text-sm text-slate-500">
        Structured safety data — visible to the patient and their family sponsors.
      </p>

      {conditions.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {conditions.map((c) => (
            <li
              key={c.id}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${typeBadge(c.type)}`}
              title={formatDate(c.createdAt)}
            >
              {c.label}
              {c.severity ? ` · ${c.severity}` : ""}
              <span className="ml-1.5 opacity-70">({typeLabel(c.type)})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No conditions or allergies recorded yet.</p>
      )}

      <form onSubmit={handleCreate} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <CustomInput
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Penicillin allergy"
          />
          <div>
            <label
              htmlFor="condition-type"
              className="block text-xs font-medium uppercase tracking-wider text-slate-500"
            >
              Type
            </label>
            <select
              id="condition-type"
              value={type}
              onChange={(e) => setType(e.target.value as ConditionType)}
              className="mt-1.5 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
            >
              <option value="condition">Condition</option>
              <option value="allergy">Allergy</option>
            </select>
          </div>
          <CustomInput
            label="Severity (optional)"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            placeholder="Mild, moderate, severe…"
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
