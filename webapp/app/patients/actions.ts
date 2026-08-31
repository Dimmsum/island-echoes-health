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

type HomeAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  clinician_id: string;
  clinician_name: string | null;
  is_self: boolean;
};

/** Fetches the viewer's own data for the "You" pill on /patients — no sponsor link involved. */
export async function fetchSelfPatientDetail(): Promise<SponsoredPatientDetail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!user || !session?.access_token) return { ...EMPTY, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, date_of_birth, avatar_url")
    .eq("id", user.id)
    .single();

  const [walletRes, statusRes, metricsRes, followUpsRes, appointmentsRes] = await Promise.allSettled([
    fetchPatientWalletData(user.id),
    fetchPatientStatusUpdates(user.id),
    fetchApiJson<{ metrics: PatientMetric[] }>(session.access_token, `/api/patients/${user.id}/metrics`),
    fetchPatientFollowUps(),
    fetchApiJson<{ appointments: HomeAppointment[] }>(session.access_token, "/api/home/appointments"),
  ]);

  let wallet: SponsoredPatientDetail["wallet"] = null;
  let transactions: WalletTransaction[] = [];
  if (walletRes.status === "fulfilled") {
    wallet = walletRes.value.wallet;
    transactions = walletRes.value.transactions;
  }
  const statusUpdates = statusRes.status === "fulfilled" ? statusRes.value : [];
  const metrics = metricsRes.status === "fulfilled" ? (metricsRes.value.metrics ?? []) : [];
  const followUps = followUpsRes.status === "fulfilled" ? followUpsRes.value : [];
  const allAppointments = appointmentsRes.status === "fulfilled" ? (appointmentsRes.value.appointments ?? []) : [];
  const appointments: TimelineAppointment[] = allAppointments
    .filter((a) => a.is_self)
    .map((a) => ({
      id: a.id,
      scheduled_at: a.scheduled_at,
      status: a.status,
      clinician_id: a.clinician_id,
      clinician_name: a.clinician_name,
      clinician_avatar_url: null,
    }));

  const now = Date.now();
  const pastVisits = appointments
    .filter((a) => a.status === "completed" || a.status === "no_show")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  const upcomingVisits = appointments
    .filter((a) => a.status === "scheduled" && new Date(a.scheduled_at).getTime() >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const lastVisitDate = pastVisits[0]?.scheduled_at ?? null;
  const daysSinceLastVisit = lastVisitDate ? Math.floor((now - new Date(lastVisitDate).getTime()) / 86_400_000) : null;
  const pendingFollowUps = followUps.filter((f) => f.status === "pending");

  return {
    link: null,
    patient: {
      id: user.id,
      full_name: profile?.full_name ?? null,
      date_of_birth: profile?.date_of_birth ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    carePlan: null,
    metrics,
    appointments,
    careSummary: {
      lastVisitDate,
      daysSinceLastVisit,
      nextAppointmentDate: upcomingVisits[0]?.scheduled_at ?? null,
      openFollowUpsCount: pendingFollowUps.length,
      overdueFollowUpsCount: pendingFollowUps.filter((f) => f.overdue).length,
    },
    wallet,
    transactions,
    statusUpdates,
    followUps,
  };
}
