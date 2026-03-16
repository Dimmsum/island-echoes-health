import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { supabase } from './supabase';

export type LinkedPatient = {
  id: string;
  started_at: string;
  care_plan: { id: string; name: string; slug?: string; price_cents?: number } | null;
  patient: { id: string; full_name: string; age: number | null; avatar_url: string | null } | null;
};

export type UpcomingAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  clinician_id: string | null;
  patient_id: string;
  clinician_name: string | null;
  clinician_avatar_url: string | null;
  patient_name: string | null;
};

export type PendingConsent = {
  id: string;
  patient_email: string;
  care_plan: { id: string; name: string } | null;
  sponsor_name: string;
};

export type UserHomeResponse = {
  profile: { role: string; full_name: string | null } | null;
  linkedPatients: LinkedPatient[];
  mySponsors: unknown[];
  pendingConsents: PendingConsent[];
  upcomingAppointments: UpcomingAppointment[];
  notifications: unknown[];
  carePlans: { id: string; name: string; slug?: string; price_cents?: number | null; features?: string[] | null }[];
};

export type UserHomeState =
  | { status: 'idle' | 'loading'; data: null; error: null }
  | { status: 'loaded'; data: UserHomeResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useUserHomeData(): UserHomeState {
  const [state, setState] = useState<UserHomeState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState({ status: 'loading', data: null, error: null });
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Not signed in.' });
        return;
      }

      try {
        const res = await apiFetch('/api/home', { accessToken });
        const json = (await res.json()) as UserHomeResponse & { error?: string };
        if (!res.ok || json.error) {
          if (!cancelled) setState({ status: 'error', data: null, error: json.error || 'Failed to load home data.' });
          return;
        }
        if (!cancelled) {
          setState({ status: 'loaded', data: json, error: null });
        }
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Network error. Please try again.' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

