import { mono } from "../../ClinicianPortalSidebar";
import { LabResultsSection } from "../../appointments/[id]/LabResultsSection";
import type { LabResult } from "../../lab-result-types";
import type { VitalsReading } from "./patient-chart-types";

type Props = {
  patientId: string;
  vitalsHistory: VitalsReading[];
  latestBp: { systolic: number; diastolic: number; recordedAt: string } | null;
  latestWeightKg: number | null;
  latestA1c: number | null;
  labResults: LabResult[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-[100px]">
      <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
        {label}
      </div>
      <div className="mt-1.5 text-[13.5px] font-semibold text-[#14251c]" style={mono}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-[#8C9A91]">{sub}</div>}
    </div>
  );
}

export function VitalsTab({
  patientId,
  vitalsHistory,
  latestBp,
  latestWeightKg,
  latestA1c,
  labResults,
}: Props) {
  const readings = vitalsHistory.filter(
    (r) =>
      r.systolic != null ||
      r.diastolic != null ||
      r.weightKg != null ||
      r.a1c != null ||
      r.heartRateBpm != null ||
      r.temperatureC != null,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
        <StatTile
          label="Blood pressure"
          value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"}
          sub={latestBp ? formatDate(latestBp.recordedAt) : undefined}
        />
        <div className="h-8 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
        <StatTile label="HbA1c" value={latestA1c != null ? `${latestA1c}%` : "—"} />
        <div className="h-8 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
        <StatTile label="Weight" value={latestWeightKg != null ? `${latestWeightKg} kg` : "—"} />
      </div>

      <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-[rgba(18,61,43,.08)] px-5 py-4">
          <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
            Recent readings
          </span>
        </div>
        {readings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#8C9A91]">No readings recorded yet.</p>
        ) : (
          <>
            <div className="hidden gap-3 border-b border-[rgba(18,61,43,.08)] bg-[#fbfcfb] px-5 py-3 text-[9.5px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0] sm:grid sm:grid-cols-[80px_1fr_90px_90px]" style={mono}>
              <span>Date</span>
              <span>Blood pressure</span>
              <span>Weight</span>
              <span>HbA1c</span>
            </div>
            <div className="flex flex-col divide-y divide-[rgba(18,61,43,.06)]">
              {readings.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-2 gap-x-3 gap-y-1 px-5 py-3.5 text-xs sm:grid-cols-[80px_1fr_90px_90px] sm:items-center"
                >
                  <span className="font-medium text-[#9aa8a0]" style={mono}>
                    {formatDate(r.recordedAt)}
                  </span>
                  <span className="font-semibold text-[#14251c]" style={mono}>
                    {r.systolic != null && r.diastolic != null ? `${r.systolic}/${r.diastolic} mmHg` : "—"}
                  </span>
                  <span className="text-[#5a6a61]">{r.weightKg != null ? `${r.weightKg} kg` : "—"}</span>
                  <span className="text-[#5a6a61]">{r.a1c != null ? `${r.a1c}%` : "—"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <LabResultsSection patientId={patientId} labResults={labResults} />
    </div>
  );
}
