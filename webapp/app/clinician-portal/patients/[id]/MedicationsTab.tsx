import { mono } from "../../ClinicianPortalSidebar";
import { MedicationsSection } from "../../appointments/[id]/MedicationsSection";
import { ConditionsSection } from "../../appointments/[id]/ConditionsSection";
import type { Medication } from "../../medication-types";
import type { PatientCondition } from "../../condition-types";

type Props = {
  patientId: string;
  medications: Medication[];
  conditions: PatientCondition[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function MedicationsTab({ patientId, medications, conditions }: Props) {
  const allergies = conditions.filter((c) => c.type === "allergy");

  return (
    <div className="flex flex-col gap-3.5">
      {allergies.length === 0 ? (
        <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white px-5 py-4 text-xs text-[#8C9A91]">
          No allergies recorded.
        </div>
      ) : (
        allergies.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-3 rounded-[14px] border border-[rgba(192,112,90,.3)] bg-white px-5 py-4"
          >
            <span className="h-[7px] w-[7px] flex-none rounded-full bg-[#C0705A]" />
            <div className="min-w-[200px] flex-1">
              <div className="text-[12.5px] font-semibold text-[#14251c]">
                {a.label}
                {a.severity ? ` — ${a.severity}` : ""}
              </div>
              <div className="mt-0.5 text-[11px] text-[#8C9A91]" style={mono}>
                Recorded {formatDate(a.createdAt)}
              </div>
            </div>
          </div>
        ))
      )}

      <MedicationsSection patientId={patientId} medications={medications} />
      <ConditionsSection patientId={patientId} conditions={conditions} />
    </div>
  );
}
