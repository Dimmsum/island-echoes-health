"use client";

import { useMemo, useState } from "react";
import type { PatientMetric } from "@/app/home/actions";

type Props = {
  metrics: PatientMetric[];
};

type Range = "7D" | "30D" | "90D" | "All";
const RANGES: Range[] = ["7D", "30D", "90D", "All"];
const RANGE_DAYS: Record<Range, number | null> = { "7D": 7, "30D": 30, "90D": 90, All: null };

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

const ADHERENCE_COLOR: Record<string, string> = {
  good: "#1F8A5B",
  fair: "#E3B341",
  poor: "#C0705A",
};

function sparklinePoints(values: number[], width = 150, height: number = 36): string {
  if (values.length === 0) return "";
  if (values.length === 1) return `0,${height / 2} ${width},${height / 2}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function withinRange(iso: string, days: number | null): boolean {
  if (days == null) return true;
  return Date.now() - new Date(iso).getTime() <= days * 86_400_000;
}

export function VitalsPanel({ metrics }: Props) {
  const [range, setRange] = useState<Range>("30D");
  const [showSystolic, setShowSystolic] = useState(true);
  const [showDiastolic, setShowDiastolic] = useState(true);

  // metrics arrive newest-first; chart wants oldest-first.
  const chronological = useMemo(() => [...metrics].reverse(), [metrics]);
  const filtered = useMemo(
    () => chronological.filter((m) => withinRange(m.recorded_at, RANGE_DAYS[range])),
    [chronological, range],
  );

  const latest = metrics[0] ?? null;
  const previous = metrics[1] ?? null;

  const systolicValues = filtered.map((m) => m.blood_pressure_systolic).filter((v): v is number => v != null);
  const diastolicValues = filtered.map((m) => m.blood_pressure_diastolic).filter((v): v is number => v != null);
  const weightValues = filtered.map((m) => m.weight_kg).filter((v): v is number => v != null);

  const avgSystolic = systolicValues.length
    ? Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length)
    : null;
  const avgDiastolic = diastolicValues.length
    ? Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length)
    : null;

  const bpDelta =
    latest?.blood_pressure_systolic != null && previous?.blood_pressure_systolic != null
      ? latest.blood_pressure_systolic - previous.blood_pressure_systolic
      : null;
  const weightDelta =
    latest?.weight_kg != null && previous?.weight_kg != null ? latest.weight_kg - previous.weight_kg : null;
  const a1cDelta = latest?.a1c != null && previous?.a1c != null ? latest.a1c - previous.a1c : null;

  const recentAdherence = metrics.slice(0, 9).filter((m) => m.medication_adherence != null).reverse();

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E9EEE9] bg-white px-[18px] py-3.5">
        <div className="flex gap-0.5 rounded-[9px] bg-[#F4F7F3] p-[3px]">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold transition ${
                range === r ? "bg-white text-[#0f5132] shadow-sm" : "text-[#7a8a80] hover:text-[#16241D]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-[#EEF2EE]" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSystolic((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              showSystolic ? "bg-[#0f3d2b] text-white" : "border border-[#E6EBE6] text-[#5a6a60]"
            }`}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: showSystolic ? "#7ED0A0" : "#c9cec9" }} />
            Systolic
          </button>
          <button
            type="button"
            onClick={() => setShowDiastolic((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              showDiastolic ? "bg-[#0f3d2b] text-white" : "border border-[#E6EBE6] text-[#5a6a60]"
            }`}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: showDiastolic ? "#E3B341" : "#c9cec9" }} />
            Diastolic
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-[14px] bg-[#0f3d2b] p-4">
          <div style={monoStyle} className="text-[9.5px] uppercase tracking-[.1em] text-[#8fb5a0]">
            Blood pressure
          </div>
          <div className="mt-2.5 text-[20px] font-semibold text-white">
            {latest?.blood_pressure_systolic ?? "—"}
            <span className="text-[12px] text-[#a9c6b7]">/{latest?.blood_pressure_diastolic ?? "—"}</span>
          </div>
          <svg viewBox="0 0 150 36" className="mt-1 h-9 w-full">
            <polyline fill="none" stroke="#7ED0A0" strokeWidth="2" points={sparklinePoints(systolicValues)} />
          </svg>
          <div style={monoStyle} className="text-[9.5px] text-[#8fb5a0]">
            {bpDelta == null ? "—" : bpDelta === 0 ? "No change" : `${bpDelta > 0 ? "↑" : "↓"} ${Math.abs(bpDelta)} mmHg`}
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E9EEE9] bg-white p-4">
          <div style={monoStyle} className="text-[9.5px] uppercase tracking-[.1em] text-[#8C9A91]">
            Weight
          </div>
          <div className="mt-2.5 text-[20px] font-semibold text-[#14251c]">
            {latest?.weight_kg ?? "—"}
            <span className="text-[12px] text-[#8C9A91]"> kg</span>
          </div>
          <svg viewBox="0 0 150 36" className="mt-1 h-9 w-full">
            <polyline fill="none" stroke="#c9cec9" strokeWidth="2" points={sparklinePoints(weightValues)} />
          </svg>
          <div style={monoStyle} className="text-[9.5px] text-[#9aa8a0]">
            {weightDelta == null
              ? "—"
              : weightDelta === 0
                ? "No change"
                : `${weightDelta > 0 ? "↑" : "↓"} ${Math.abs(weightDelta).toFixed(1)} kg`}
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E9EEE9] bg-white p-4">
          <div style={monoStyle} className="text-[9.5px] uppercase tracking-[.1em] text-[#8C9A91]">
            Adherence
          </div>
          <div className="mt-2.5 text-[20px] font-semibold capitalize text-[#14251c]">
            {latest?.medication_adherence ?? "—"}
          </div>
          {recentAdherence.length > 0 ? (
            <div className="mt-2.5 flex h-[22px] items-end gap-[2px]">
              {recentAdherence.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[2px]"
                  style={{
                    height: m.medication_adherence === "good" ? "100%" : m.medication_adherence === "fair" ? "58%" : "30%",
                    background: ADHERENCE_COLOR[m.medication_adherence ?? "good"],
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-2.5 h-[22px]" />
          )}
          <div style={monoStyle} className="mt-1 text-[9.5px] text-[#9aa8a0]">
            LAST {recentAdherence.length} RECORDED
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E9EEE9] bg-white p-4">
          <div style={monoStyle} className="text-[9.5px] uppercase tracking-[.1em] text-[#8C9A91]">
            HbA1c
          </div>
          <div className="mt-2.5 text-[20px] font-semibold text-[#14251c]">
            {latest?.a1c ?? "—"}
            <span className="text-[12px] text-[#8C9A91]">%</span>
          </div>
          {latest?.a1c != null && (
            <div
              className="mt-3.5 h-1.5 rounded-full"
              style={{ background: "linear-gradient(90deg,#157347 0 45%,#E3B341 45% 72%,#C0705A 72% 100%)" }}
            />
          )}
          <div style={monoStyle} className="mt-1.5 text-[9.5px] text-[#9aa8a0]">
            {a1cDelta == null ? "—" : `${a1cDelta > 0 ? "↑" : a1cDelta < 0 ? "↓" : "NO CHANGE"} ${a1cDelta !== 0 ? Math.abs(a1cDelta).toFixed(1) : ""}`}
          </div>
        </div>

        <div className="rounded-[14px] border border-dashed border-[#DCE4DD] bg-[#FAFBFA] p-4">
          <div style={monoStyle} className="text-[9.5px] uppercase tracking-[.1em] text-[#b4bdb6]">
            Heart rate
          </div>
          <div className="mt-2.5 text-[20px] font-semibold text-[#c7cfc8]">—</div>
          <div className="mt-1 text-[10.5px] text-[#b4bdb6]">Not yet tracked</div>
        </div>

        <div className="rounded-[14px] border border-dashed border-[#DCE4DD] bg-[#FAFBFA] p-4">
          <div style={monoStyle} className="text-[9.5px] uppercase tracking-[.1em] text-[#b4bdb6]">
            Temperature
          </div>
          <div className="mt-2.5 text-[20px] font-semibold text-[#c7cfc8]">—</div>
          <div className="mt-1 text-[10.5px] text-[#b4bdb6]">Not yet tracked</div>
        </div>
      </div>

      {/* BP trend chart */}
      <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8C9A91]">
              Blood pressure · {range}
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[26px] font-bold text-[#14251c]">
                {avgSystolic ?? "—"}/{avgDiastolic ?? "—"}
              </span>
              <span className="text-[12px] font-medium text-[#8C9A91]">mmHg avg</span>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#94a298]">No readings recorded in this range.</div>
        ) : (
          <BpChart data={filtered} showSystolic={showSystolic} showDiastolic={showDiastolic} />
        )}
      </div>
    </div>
  );
}

function BpChart({
  data,
  showSystolic,
  showDiastolic,
}: {
  data: PatientMetric[];
  showSystolic: boolean;
  showDiastolic: boolean;
}) {
  const W = 760;
  const H = 180;
  const padX = 40;
  const padTop = 16;
  const padBottom = 30;

  const values = data.flatMap((m) => [m.blood_pressure_systolic, m.blood_pressure_diastolic]).filter((v): v is number => v != null);
  const min = values.length ? Math.min(...values) - 6 : 60;
  const max = values.length ? Math.max(...values) + 6 : 140;
  const span = max - min || 1;

  const x = (i: number) => (data.length === 1 ? padX : padX + (i / (data.length - 1)) * (W - padX * 2));
  const y = (v: number) => padTop + (H - padTop - padBottom) * (1 - (v - min) / span);

  function pathFor(key: "blood_pressure_systolic" | "blood_pressure_diastolic") {
    const pts = data
      .map((m, i) => (m[key] != null ? `${x(i).toFixed(1)},${y(m[key] as number).toFixed(1)}` : null))
      .filter((p): p is string => p != null);
    return pts.join(" ");
  }

  const firstLabel = new Date(data[0].recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const lastLabel = new Date(data[data.length - 1].recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const midIndex = Math.floor(data.length / 2);
  const midLabel = data.length > 2 ? new Date(data[midIndex].recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="mt-3 w-full" style={{ height: 220, overflow: "visible" }}>
      <g stroke="#eceae4" strokeWidth="1">
        <line x1={padX} y1={padTop} x2={W - padX} y2={padTop} />
        <line x1={padX} y1={(H - padBottom + padTop) / 2} x2={W - padX} y2={(H - padBottom + padTop) / 2} />
        <line x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom} />
      </g>
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#9aa8a0" textAnchor="end">
        <text x={padX - 8} y={padTop + 4}>
          {Math.round(max)}
        </text>
        <text x={padX - 8} y={(H - padBottom + padTop) / 2 + 4}>
          {Math.round((min + max) / 2)}
        </text>
        <text x={padX - 8} y={H - padBottom + 4}>
          {Math.round(min)}
        </text>
      </g>
      {showDiastolic && <polyline fill="none" stroke="#7ED0A0" strokeWidth="2.5" points={pathFor("blood_pressure_diastolic")} />}
      {showSystolic && <polyline fill="none" stroke="#0f5132" strokeWidth="2.5" points={pathFor("blood_pressure_systolic")} />}
      <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#9aa8a0" textAnchor="middle">
        <text x={x(0)} y={H + 12}>
          {firstLabel.toUpperCase()}
        </text>
        {midLabel && (
          <text x={x(midIndex)} y={H + 12}>
            {midLabel.toUpperCase()}
          </text>
        )}
        <text x={x(data.length - 1)} y={H + 12}>
          {lastLabel.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
