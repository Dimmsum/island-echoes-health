import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { apiFetch } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus = 'scheduled' | 'completed' | 'no_show' | 'cancelled';

export interface ClinicianDashboardPatient {
  patient_id: string;
  patient_name: string;
  patient_avatar: string | null;
  plan_name: string;
  next_appointment: string | null;
  next_appointment_clinician: string | null;
}

export interface DashboardAppointment {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
}

export interface DashboardTodayAppointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
}

export interface ClinicianDashboardResponse {
  profile: { role: string; full_name: string | null; avatar_url: string | null } | null;
  patientsWithPlans: ClinicianDashboardPatient[];
  carePlans: { id: string; name: string }[];
  allAppointments: DashboardAppointment[];
  todayAppointments: DashboardTodayAppointment[];
}

export interface ClinicianAppointment {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  patient_name: string;
  patient_avatar: string | null;
  clinician_name: string;
}

export interface ClinicianAppointmentsResponse {
  appointments: ClinicianAppointment[];
  activePatients: { id: string; full_name: string }[];
}

export interface ClinicianAppointmentNote {
  id: string;
  content: string;
  created_at: string;
}

export interface ClinicianAppointmentService {
  id: string;
  service_type: string;
  details: string | null;
  created_at: string;
}

export interface ClinicianPatientMetric {
  id: string;
  recorded_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  weight_kg: number | null;
  a1c: number | null;
  medication_adherence: 'good' | 'fair' | 'poor' | null;
}

export interface ClinicianAppointmentDetailResponse {
  appointment: {
    id: string;
    patient_id: string;
    clinician_id: string;
    scheduled_at: string;
    status: AppointmentStatus;
  };
  patient: { id: string; full_name: string; avatar_url: string | null } | null;
  clinician: { id: string; full_name: string; avatar_url: string | null } | null;
  notes: ClinicianAppointmentNote[];
  services: ClinicianAppointmentService[];
  previousMetrics: ClinicianPatientMetric[];
}

export interface ClinicianProfileResponse {
  profile: {
    role: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  appointmentsCount: number;
  plansCount: number;
}

export interface ClinicianPatientDetailData {
  patient: ClinicianDashboardPatient;
  appointments: ClinicianAppointment[];
  latestMetrics: ClinicianPatientMetric[];
  latestNotes: ClinicianAppointmentNote[];
  latestAppointmentId: string | null;
}

type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'loaded'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useClinicianDashboard(): AsyncState<ClinicianDashboardResponse> {
  const [state, setState] = useState<AsyncState<ClinicianDashboardResponse>>({
    status: 'loading',
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Not authenticated.' });
        return;
      }
      try {
        const res = await apiFetch('/api/clinician-portal', { accessToken });
        const json = (await res.json()) as ClinicianDashboardResponse;
        if (!cancelled) setState({ status: 'loaded', data: json, error: null });
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Failed to load dashboard.' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

export function useClinicianAppointments(): AsyncState<ClinicianAppointmentsResponse> {
  const [state, setState] = useState<AsyncState<ClinicianAppointmentsResponse>>({
    status: 'loading',
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Not authenticated.' });
        return;
      }
      try {
        const res = await apiFetch('/api/clinician-portal/appointments', { accessToken });
        const json = (await res.json()) as ClinicianAppointmentsResponse;
        if (!cancelled) setState({ status: 'loaded', data: json, error: null });
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Failed to load appointments.' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

export function useClinicianAppointmentDetail(
  id: string,
): AsyncState<ClinicianAppointmentDetailResponse> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<ClinicianAppointmentDetailResponse>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    (async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Not authenticated.' });
        return;
      }
      try {
        const res = await apiFetch(`/api/clinician-portal/appointments/${id}`, { accessToken });
        if (res.status === 404) {
          if (!cancelled) setState({ status: 'error', data: null, error: 'Appointment not found.' });
          return;
        }
        const json = (await res.json()) as ClinicianAppointmentDetailResponse;
        if (!cancelled) setState({ status: 'loaded', data: json, error: null });
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Failed to load appointment.' });
      }
    })();
    return () => { cancelled = true; };
  }, [id, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useClinicianProfile(): AsyncState<ClinicianProfileResponse> {
  const [state, setState] = useState<AsyncState<ClinicianProfileResponse>>({
    status: 'loading',
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Not authenticated.' });
        return;
      }
      try {
        const res = await apiFetch('/api/clinician-portal/profile', { accessToken });
        const json = (await res.json()) as ClinicianProfileResponse;
        if (!cancelled) setState({ status: 'loaded', data: json, error: null });
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Failed to load profile.' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

/**
 * Combined hook for the patient detail screen.
 * Fetches patient info, their appointments, and the latest appointment's metrics + notes.
 */
export function useClinicianPatientDetail(
  patientId: string,
): AsyncState<ClinicianPatientDetailData> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<ClinicianPatientDetailData>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    (async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Not authenticated.' });
        return;
      }
      try {
        // Fetch dashboard (for patient info) and all appointments in parallel
        const [dashRes, apptsRes] = await Promise.all([
          apiFetch('/api/clinician-portal', { accessToken }),
          apiFetch('/api/clinician-portal/appointments', { accessToken }),
        ]);
        const dash = (await dashRes.json()) as ClinicianDashboardResponse;
        const appts = (await apptsRes.json()) as ClinicianAppointmentsResponse;

        if (cancelled) return;

        const patient = dash.patientsWithPlans.find((p) => p.patient_id === patientId);
        if (!patient) {
          if (!cancelled) setState({ status: 'error', data: null, error: 'Patient not found.' });
          return;
        }

        const patientAppts = appts.appointments
          .filter((a) => a.patient_id === patientId)
          .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

        // Load detail of most recent appointment for metrics + notes
        const latestAppt = patientAppts[0] ?? null;
        let latestMetrics: ClinicianPatientMetric[] = [];
        let latestNotes: ClinicianAppointmentNote[] = [];

        if (latestAppt) {
          const detailRes = await apiFetch(
            `/api/clinician-portal/appointments/${latestAppt.id}`,
            { accessToken },
          );
          if (!cancelled && detailRes.ok) {
            const detail = (await detailRes.json()) as ClinicianAppointmentDetailResponse;
            latestMetrics = detail.previousMetrics;
            latestNotes = detail.notes;
          }
        }

        if (!cancelled) {
          setState({
            status: 'loaded',
            data: {
              patient,
              appointments: patientAppts,
              latestMetrics,
              latestNotes,
              latestAppointmentId: latestAppt?.id ?? null,
            },
            error: null,
          });
        }
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Failed to load patient.' });
      }
    })();
    return () => { cancelled = true; };
  }, [patientId, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  accessToken: string,
): Promise<{ error: string | null }> {
  try {
    const res = await apiFetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      accessToken,
    });
    const json = (await res.json()) as { error: string | null };
    if (!res.ok) return { error: json.error ?? 'Failed to update status.' };
    return { error: null };
  } catch {
    return { error: 'Network error.' };
  }
}

export async function addAppointmentNote(
  appointmentId: string,
  content: string,
  accessToken: string,
): Promise<{ error: string | null }> {
  try {
    const res = await apiFetch(`/api/appointments/${appointmentId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      accessToken,
    });
    const json = (await res.json()) as { error: string | null };
    if (!res.ok) return { error: json.error ?? 'Failed to add note.' };
    return { error: null };
  } catch {
    return { error: 'Network error.' };
  }
}
