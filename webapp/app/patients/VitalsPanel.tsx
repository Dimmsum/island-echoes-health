"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { PatientMetric } from "@/app/home/actions";

type Props = {
  metrics: PatientMetric[];
};

type Range = "7D" | "30D" | "90D" | "All";
const RANGES: Range[] = ["7D", "30D", "90D", "All"];
const RANGE_DAYS: Record<Range, number | null> = { "7D": 7, "30D": 30, "90D": 90, All: null };

type SeriesDef = {
  key: keyof PatientMetric;
  label: string;
  color: string;
};

type MetricKey = "bp" | "weight" | "heart_rate" | "temperature" | "a1c";

type MetricChartConfig = {
  title: string;
  unit: string;
  series: SeriesDef[];
  emptyLabel: string;
};

const METRIC_CHARTS: Record<MetricKey, MetricChartConfig> = {
  bp: {
    title: "Blood pressure",
    unit: "mmHg",
    series: [
      { key: "blood_pressure_diastolic", label: "Diastolic", color: "#7ED0A0" },
      { key: "blood_pressure_systolic", label: "Systolic", color: "#0f5132" },
    ],
    emptyLabel: "No readings recorded in this range.",
  },
  weight: {
    title: "Weight",
    unit: "kg",
    series: [{ key: "weight_kg", label: "Weight", color: "#0f5132" }],
    emptyLabel: "No weight readings recorded in this range.",
  },
  heart_rate: {
    title: "Heart rate",
    unit: "bpm",
    series: [{ key: "heart_rate_bpm", label: "Heart rate", color: "#0f5132" }],
    emptyLabel: "No heart rate readings recorded in this range.",
  },
  temperature: {
    title: "Temperature",
    unit: "°C",
    series: [{ key: "temperature_c", label: "Temperature", color: "#0f5132" }],
    emptyLabel: "No temperature readings recorded in this range.",
  },
  a1c: {
    title: "HbA1c",
    unit: "%",
    series: [{ key: "a1c", label: "HbA1c", color: "#0f5132" }],
    emptyLabel: "No HbA1c readings recorded in this range.",
  },
};
const METRIC_ORDER: MetricKey[] = ["bp", "weight", "heart_rate", "temperature", "a1c"];

const CHECKED_METRICS_STORAGE_KEY = "ie-vitals-checked-metrics";

function readStoredCheckedMetrics(): Set<MetricKey> {
  if (typeof window === "undefined") return new Set(["bp"]);
  try {
    const raw = window.localStorage.getItem(CHECKED_METRICS_STORAGE_KEY);
    if (!raw) return new Set(["bp"]);
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set(["bp"]);
    const valid = parsed.filter((k): k is MetricKey => METRIC_ORDER.includes(k as MetricKey));
    return valid.length ? new Set(valid) : new Set(["bp"]);
  } catch {
    return new Set(["bp"]);
  }
}

function computeAvgLabel(series: SeriesDef[], unit: string, data: PatientMetric[]): string {
  const averages = series.map((s) => {
    const values = data.map((m) => m[s.key] as number | null).filter((v): v is number => v != null);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  });
  if (averages.every((a) => a == null)) return `— ${unit}`;
  const formatted = averages.map((a) => (a == null ? "—" : Number.isInteger(a) ? a.toString() : a.toFixed(1)));
  return `${formatted.join("/")} ${unit} avg`;
}

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

function TileHeader({
  title,
  checked,
  onToggle,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div
        style={monoStyle}
        className={`text-[9.5px] uppercase tracking-[.1em] ${checked ? "text-[#8fb5a0]" : "text-[#8C9A91]"}`}
      >
        {title}
      </div>
      <label
        className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="sr-only"
          aria-label={`Show ${title} chart`}
        />
        <span
          className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] transition ${
            checked ? "bg-[#9aa8a0]" : "bg-[#E3E7E3]"
          }`}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
              <path
                d="M2.5 6.2l2.4 2.4L9.5 3.6"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </label>
    </div>
  );
}

export function VitalsPanel({ metrics }: Props) {
  const [range, setRange] = useState<Range>("30D");
  const [checkedMetrics, setCheckedMetrics] = useState<Set<MetricKey>>(() => readStoredCheckedMetrics());

  useEffect(() => {
    try {
      window.localStorage.setItem(CHECKED_METRICS_STORAGE_KEY, JSON.stringify(Array.from(checkedMetrics)));
    } catch {
      // ignore write failures (e.g. private browsing with storage disabled)
    }
  }, [checkedMetrics]);

  function toggleMetric(key: MetricKey) {
    setCheckedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // metrics arrive newest-first; chart wants oldest-first.
  const chronological = useMemo(() => [...metrics].reverse(), [metrics]);
  const filtered = useMemo(
    () => chronological.filter((m) => withinRange(m.recorded_at, RANGE_DAYS[range])),
    [chronological, range],
  );

  const latest = metrics[0] ?? null;
  const previous = metrics[1] ?? null;

  const systolicValues = filtered.map((m) => m.blood_pressure_systolic).filter((v): v is number => v != null);
  const weightValues = filtered.map((m) => m.weight_kg).filter((v): v is number => v != null);
  const heartRateValues = filtered.map((m) => m.heart_rate_bpm).filter((v): v is number => v != null);
  const temperatureValues = filtered.map((m) => m.temperature_c).filter((v): v is number => v != null);

  const bpDelta =
    latest?.blood_pressure_systolic != null && previous?.blood_pressure_systolic != null
      ? latest.blood_pressure_systolic - previous.blood_pressure_systolic
      : null;
  const weightDelta =
    latest?.weight_kg != null && previous?.weight_kg != null ? latest.weight_kg - previous.weight_kg : null;
  const a1cDelta = latest?.a1c != null && previous?.a1c != null ? latest.a1c - previous.a1c : null;
  const heartRateDelta =
    latest?.heart_rate_bpm != null && previous?.heart_rate_bpm != null
      ? latest.heart_rate_bpm - previous.heart_rate_bpm
      : null;
  const temperatureDelta =
    latest?.temperature_c != null && previous?.temperature_c != null
      ? latest.temperature_c - previous.temperature_c
      : null;

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
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {(() => {
          const bpChecked = checkedMetrics.has("bp");
          return (
            <div
              onClick={() => toggleMetric("bp")}
              className={`cursor-pointer rounded-[14px] p-4 transition ${
                bpChecked ? "bg-[#0f3d2b]" : "border border-[#E9EEE9] bg-white"
              }`}
            >
              <TileHeader title="Blood pressure" checked={bpChecked} onToggle={() => toggleMetric("bp")} />
              <div className={`mt-2.5 text-[20px] font-semibold ${bpChecked ? "text-white" : "text-[#14251c]"}`}>
                {latest?.blood_pressure_systolic ?? "—"}
                <span className={`text-[12px] ${bpChecked ? "text-[#a9c6b7]" : "text-[#8C9A91]"}`}>
                  /{latest?.blood_pressure_diastolic ?? "—"}
                </span>
              </div>
              <svg viewBox="0 0 150 36" className="mt-1 h-9 w-full">
                <polyline
                  fill="none"
                  stroke={bpChecked ? "#7ED0A0" : "#c9cec9"}
                  strokeWidth="2"
                  points={sparklinePoints(systolicValues)}
                />
              </svg>
              <div style={monoStyle} className={`text-[9.5px] ${bpChecked ? "text-[#8fb5a0]" : "text-[#9aa8a0]"}`}>
                {bpDelta == null ? "—" : bpDelta === 0 ? "No change" : `${bpDelta > 0 ? "↑" : "↓"} ${Math.abs(bpDelta)} mmHg`}
              </div>
            </div>
          );
        })()}

        {(() => {
          const weightChecked = checkedMetrics.has("weight");
          return (
            <div
              onClick={() => toggleMetric("weight")}
              className={`cursor-pointer rounded-[14px] p-4 transition ${
                weightChecked ? "bg-[#0f3d2b]" : "border border-[#E9EEE9] bg-white"
              }`}
            >
              <TileHeader title="Weight" checked={weightChecked} onToggle={() => toggleMetric("weight")} />
              <div className={`mt-2.5 text-[20px] font-semibold ${weightChecked ? "text-white" : "text-[#14251c]"}`}>
                {latest?.weight_kg ?? "—"}
                <span className={`text-[12px] ${weightChecked ? "text-[#a9c6b7]" : "text-[#8C9A91]"}`}> kg</span>
              </div>
              <svg viewBox="0 0 150 36" className="mt-1 h-9 w-full">
                <polyline
                  fill="none"
                  stroke={weightChecked ? "#7ED0A0" : "#c9cec9"}
                  strokeWidth="2"
                  points={sparklinePoints(weightValues)}
                />
              </svg>
              <div style={monoStyle} className={`text-[9.5px] ${weightChecked ? "text-[#8fb5a0]" : "text-[#9aa8a0]"}`}>
                {weightDelta == null
                  ? "—"
                  : weightDelta === 0
                    ? "No change"
                    : `${weightDelta > 0 ? "↑" : "↓"} ${Math.abs(weightDelta).toFixed(1)} kg`}
              </div>
            </div>
          );
        })()}

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

        {(() => {
          const a1cChecked = checkedMetrics.has("a1c");
          return (
            <div
              onClick={() => toggleMetric("a1c")}
              className={`cursor-pointer rounded-[14px] p-4 transition ${
                a1cChecked ? "bg-[#0f3d2b]" : "border border-[#E9EEE9] bg-white"
              }`}
            >
              <TileHeader title="HbA1c" checked={a1cChecked} onToggle={() => toggleMetric("a1c")} />
              <div className={`mt-2.5 text-[20px] font-semibold ${a1cChecked ? "text-white" : "text-[#14251c]"}`}>
                {latest?.a1c ?? "—"}
                <span className={`text-[12px] ${a1cChecked ? "text-[#a9c6b7]" : "text-[#8C9A91]"}`}>%</span>
              </div>
              {latest?.a1c != null && (
                <div
                  className="mt-3.5 h-1.5 rounded-full"
                  style={{ background: "linear-gradient(90deg,#157347 0 45%,#E3B341 45% 72%,#C0705A 72% 100%)" }}
                />
              )}
              <div style={monoStyle} className={`mt-1.5 text-[9.5px] ${a1cChecked ? "text-[#8fb5a0]" : "text-[#9aa8a0]"}`}>
                {a1cDelta == null
                  ? "—"
                  : `${a1cDelta > 0 ? "↑" : a1cDelta < 0 ? "↓" : "NO CHANGE"} ${a1cDelta !== 0 ? Math.abs(a1cDelta).toFixed(1) : ""}`}
              </div>
            </div>
          );
        })()}

        {(() => {
          const heartRateChecked = checkedMetrics.has("heart_rate");
          return (
            <div
              onClick={() => toggleMetric("heart_rate")}
              className={`cursor-pointer rounded-[14px] p-4 transition ${
                heartRateChecked ? "bg-[#0f3d2b]" : "border border-[#E9EEE9] bg-white"
              }`}
            >
              <TileHeader title="Heart rate" checked={heartRateChecked} onToggle={() => toggleMetric("heart_rate")} />
              <div className={`mt-2.5 text-[20px] font-semibold ${heartRateChecked ? "text-white" : "text-[#14251c]"}`}>
                {latest?.heart_rate_bpm ?? "—"}
                <span className={`text-[12px] ${heartRateChecked ? "text-[#a9c6b7]" : "text-[#8C9A91]"}`}> bpm</span>
              </div>
              {heartRateValues.length > 0 ? (
                <svg viewBox="0 0 150 36" className="mt-1 h-9 w-full">
                  <polyline
                    fill="none"
                    stroke={heartRateChecked ? "#7ED0A0" : "#c9cec9"}
                    strokeWidth="2"
                    points={sparklinePoints(heartRateValues)}
                  />
                </svg>
              ) : (
                <div className="mt-1 h-9" />
              )}
              <div style={monoStyle} className={`text-[9.5px] ${heartRateChecked ? "text-[#8fb5a0]" : "text-[#9aa8a0]"}`}>
                {latest?.heart_rate_bpm == null
                  ? "No heart rate recorded yet"
                  : heartRateDelta == null
                    ? "—"
                    : heartRateDelta === 0
                      ? "No change"
                      : `${heartRateDelta > 0 ? "↑" : "↓"} ${Math.abs(heartRateDelta)} bpm`}
              </div>
            </div>
          );
        })()}

        {(() => {
          const temperatureChecked = checkedMetrics.has("temperature");
          return (
            <div
              onClick={() => toggleMetric("temperature")}
              className={`cursor-pointer rounded-[14px] p-4 transition ${
                temperatureChecked ? "bg-[#0f3d2b]" : "border border-[#E9EEE9] bg-white"
              }`}
            >
              <TileHeader title="Temperature" checked={temperatureChecked} onToggle={() => toggleMetric("temperature")} />
              <div className={`mt-2.5 text-[20px] font-semibold ${temperatureChecked ? "text-white" : "text-[#14251c]"}`}>
                {latest?.temperature_c ?? "—"}
                <span className={`text-[12px] ${temperatureChecked ? "text-[#a9c6b7]" : "text-[#8C9A91]"}`}> °C</span>
              </div>
              {temperatureValues.length > 0 ? (
                <svg viewBox="0 0 150 36" className="mt-1 h-9 w-full">
                  <polyline
                    fill="none"
                    stroke={temperatureChecked ? "#7ED0A0" : "#c9cec9"}
                    strokeWidth="2"
                    points={sparklinePoints(temperatureValues)}
                  />
                </svg>
              ) : (
                <div className="mt-1 h-9" />
              )}
              <div style={monoStyle} className={`text-[9.5px] ${temperatureChecked ? "text-[#8fb5a0]" : "text-[#9aa8a0]"}`}>
                {latest?.temperature_c == null
                  ? "No temperature recorded yet"
                  : temperatureDelta == null
                    ? "—"
                    : temperatureDelta === 0
                      ? "No change"
                      : `${temperatureDelta > 0 ? "↑" : "↓"} ${Math.abs(temperatureDelta).toFixed(1)} °C`}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Metric trend charts */}
      {METRIC_ORDER.filter((key) => checkedMetrics.has(key)).length === 0 ? (
        <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px] text-center text-[13px] text-[#94a298]">
          Select a metric above to see its chart.
        </div>
      ) : (
        METRIC_ORDER.filter((key) => checkedMetrics.has(key)).map((key) => {
          const cfg = METRIC_CHARTS[key];
          const seriesData = filtered.filter((m) => cfg.series.some((s) => m[s.key] != null));
          return (
            <div key={key} className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8C9A91]">
                    {cfg.title} · {range}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[26px] font-bold text-[#14251c]">
                      {computeAvgLabel(cfg.series, cfg.unit, filtered)}
                    </span>
                  </div>
                </div>
              </div>

              {seriesData.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[#94a298]">{cfg.emptyLabel}</div>
              ) : (
                <MetricChart data={seriesData} series={cfg.series} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function formatTick(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={monoStyle}
      className="rounded-[8px] border border-[#E9EEE9] bg-white px-3 py-2 text-[10px] shadow-md"
    >
      <div className="text-[#8C9A91]">{typeof label === "string" ? formatTick(label) : label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="mt-0.5 flex items-center gap-1.5" style={{ color: entry.color }}>
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: entry.color }} />
          {entry.name}: {entry.value ?? "—"}
        </div>
      ))}
    </div>
  );
}

function MetricChart({ data, series }: { data: PatientMetric[]; series: SeriesDef[] }) {
  const values = data
    .flatMap((m) => series.map((s) => m[s.key] as number | null))
    .filter((v): v is number => v != null);
  const pad = values.length ? Math.max((Math.max(...values) - Math.min(...values)) * 0.15, 1) : 6;
  const min = values.length ? Math.min(...values) - pad : 0;
  const max = values.length ? Math.max(...values) + pad : 100;

  const chartData = data.map((m) => ({
    date: m.recorded_at,
    ...Object.fromEntries(series.map((s) => [s.label, m[s.key]])),
  }));

  return (
    <div className="mt-3 w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#eceae4" />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            tick={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fill: "#9aa8a0" }}
            axisLine={{ stroke: "#eceae4" }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fill: "#9aa8a0" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={(props: TooltipContentProps<ValueType, NameType>) => <ChartTooltip {...props} />} />
          {series.map((s) => (
            <Line key={s.label} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2.5} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
