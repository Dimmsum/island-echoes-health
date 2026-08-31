import { Appointment, STATUS_BADGE_STYLE, STATUS_LABEL, TYPE_LABEL, getDisplayStatus } from "./types";

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

export function AppointmentCard({ apt, past = false }: { apt: Appointment; past?: boolean }) {
  const date = new Date(apt.scheduled_at);
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const typeLabel = apt.appointment_type ? (TYPE_LABEL[apt.appointment_type] ?? apt.appointment_type) : "Visit";
  const displayStatus = getDisplayStatus(apt);
  const statusLabel = STATUS_LABEL[displayStatus] ?? displayStatus;
  const badgeStyle = STATUS_BADGE_STYLE[displayStatus] ?? "bg-[#E9EEF8] text-[#3b5998]";

  return (
    <div
      className={`relative flex items-center gap-5 rounded-2xl border bg-white p-[22px] ${
        past ? "border-[#E9EEE9]" : apt.is_self ? "border-[#C9E6D5]" : "border-[#CFE0FA]"
      }`}
    >
      {/* Dot indicator */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {past ? (
          displayStatus === "cancelled" ? (
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold text-[#B23B3B]"
              style={{ background: "#FBE3E3", boxShadow: "0 0 0 3px #F6D3D3" }}
            >
              ✕
            </div>
          ) : displayStatus === "no_show" || displayStatus === "missed" ? (
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold text-[#9a7a06]"
              style={{ background: "#FBF1CF", boxShadow: "0 0 0 3px #F5E6A8" }}
            >
              !
            </div>
          ) : (
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold text-[#1F8A5B]"
              style={{ background: "#E4F1E9", boxShadow: "0 0 0 3px #DCEFE3" }}
            >
              ✓
            </div>
          )
        ) : (
          <div
            className={`h-[26px] w-[26px] rounded-full ${apt.is_self ? "bg-[#1F8A5B]" : "bg-[#3b5998]"}`}
            style={{ boxShadow: apt.is_self ? "0 0 0 3px #C9E6D5" : "0 0 0 3px #CFE0FA" }}
          />
        )}
      </div>

      {/* Date + time */}
      <div className="w-40 shrink-0">
        <p style={monoStyle} className={`text-[11px] font-semibold uppercase tracking-[.08em] ${past ? "text-[#aab5ad]" : apt.is_self ? "text-[#1F8A5B]" : "text-[#3b5998]"}`}>
          {dateStr}
        </p>
        <p style={monoStyle} className={`mt-0.5 text-[13px] font-bold ${past ? "text-[#c0c8c3]" : apt.is_self ? "text-[#1F8A5B]" : "text-[#3b5998]"}`}>
          {timeStr}
        </p>
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-[15px] font-bold ${past ? "text-[#7a8a80]" : "text-[#16241D]"}`}>{typeLabel}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.04em] ${
              apt.is_self ? "bg-[#E4F1E9] text-[#1F8A5B]" : "bg-[#E9EEF8] text-[#3b5998]"
            }`}
          >
            {apt.is_self ? "You" : apt.patient_name ?? "Connected"}
          </span>
        </div>
        {apt.clinician_name && (
          <p className="mt-0.5 text-[13px] text-[#5a6a60]">with {apt.clinician_name}</p>
        )}
      </div>

      {/* Status badge */}
      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${badgeStyle}`}>
        {statusLabel}
      </span>
    </div>
  );
}
