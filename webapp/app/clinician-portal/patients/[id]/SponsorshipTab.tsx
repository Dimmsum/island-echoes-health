import type { PatientWallet, SponsorLink } from "./patient-chart-types";

type Props = {
  sponsors: SponsorLink[];
  wallet: PatientWallet | null;
};

function formatBalance(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initialsFor(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function SponsorshipTab({ sponsors, wallet }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]">
          Wallet balance
        </div>
        <div className="mt-2 text-2xl font-semibold text-[#14251c]">
          {wallet ? formatBalance(wallet.balanceCents) : "—"}
        </div>
        <p className="mt-1 text-xs text-[#8C9A91]">
          Under the wallet model, any user — including the patient — can top this up; it isn&apos;t
          exclusive to a single sponsor.
        </p>
      </div>

      <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]">
          Active sponsors
        </div>
        {sponsors.length === 0 ? (
          <p className="mt-3 text-sm text-[#8C9A91]">Self-funded — no active sponsor link.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {sponsors.map((s) => (
              <li key={s.sponsorId} className="flex items-center gap-3 rounded-xl bg-[#f4f6f4] px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dff0e4] text-xs font-semibold text-[#0f5132]">
                  {initialsFor(s.sponsorName)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#14251c]">{s.sponsorName ?? "Sponsor"}</div>
                  <div className="text-xs text-[#8C9A91]">Since {formatDate(s.startedAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
