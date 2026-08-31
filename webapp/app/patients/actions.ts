"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import {
  fetchPatientWalletData,
  fetchPatientStatusUpdates,
  fetchPatientFollowUps,
  type PatientMetric,
  type FollowUp,
} from "@/app/home/actions";
import type { WalletTransaction } from "@/app/home/WalletCard";
import type { StatusUpdate } from "@/app/clinician-portal/status-update-types";
import type { TimelineAppointment } from "./PatientTimelineTabs";

export type SponsoredPatientDetail = {
  link: { id: string; started_at: string; care_plan_id: string; patient_id: string } | null;
  patient: { id: string; full_name: string | null; date_of_birth?: string | null; avatar_url?: string | null } | null;
  carePlan: { id: string; name: string; slug: string; price_cents: number } | null;
  metrics: PatientMetric[];
  appointments: TimelineAppointment[];
  careSummary: {
    lastVisitDate: string | null;
    daysSinceLastVisit: number | null;
    nextAppointmentDate: string | null;
    openFollowUpsCount: number;
    overdueFollowUpsCount: number;
  } | null;
  wallet: { id: string; balanceCents: number; updatedAt: string } | null;
  transactions: WalletTransaction[];
  statusUpdates: StatusUpdate[];
  followUps: FollowUp[];
  error?: string;
};

const EMPTY: SponsoredPatientDetail = {
  link: null,
  patient: null,
  carePlan: null,
  metrics: [],
  appointments: [],
  careSummary: null,
  wallet: null,
  transactions: [],
  statusUpdates: [],
  followUps: [],
};

/** Fetches everything the patient-detail view on /patients needs for one linked patient. */
export async function fetchSponsoredPatientDetail(linkId: string): Promise<SponsoredPatientDetail> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { ...EMPTY, error: "Not signed in." };

  type BaseData = Omit<SponsoredPatientDetail, "wallet" | "transactions" | "statusUpdates" | "followUps" | "error">;
  let base: BaseData;
  try {
    base = await fetchApiJson<BaseData>(session.access_token, `/api/home/sponsored/${linkId}`);
  } catch {
    return { ...EMPTY, error: "Failed to load patient." };
  }

  let wallet: SponsoredPatientDetail["wallet"] = null;
  let transactions: WalletTransaction[] = [];
  let statusUpdates: StatusUpdate[] = [];
  let followUps: FollowUp[] = [];

  if (base.patient?.id) {
    const [walletRes, statusRes, followUpsRes] = await Promise.allSettled([
      fetchPatientWalletData(base.patient.id),
      fetchPatientStatusUpdates(base.patient.id),
      fetchPatientFollowUps(base.patient.id),
    ]);
    if (walletRes.status === "fulfilled") {
      wallet = walletRes.value.wallet;
      transactions = walletRes.value.transactions;
    }
    if (statusRes.status === "fulfilled") statusUpdates = statusRes.value;
    if (followUpsRes.status === "fulfilled") followUps = followUpsRes.value;
  }

  return { ...base, wallet, transactions, statusUpdates, followUps };
}
