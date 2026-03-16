import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { supabase } from './supabase';

export interface SponsoredPatientResponse {
  id: string;
  full_name: string;
  age_years?: number | null;
  plan_name?: string | null;
  started_at?: string | null;
  monthly_amount_cents?: number | null;
  total_visits?: number | null;
  upcoming_visits?: number | null;
  metrics_count?: number | null;
}

type SponsoredPatientApiResponse = {
  link: { id: string; started_at: string; care_plan_id: string; patient_id: string };
  patient: { id: string; full_name: string; date_of_birth: string | null } | null;
  carePlan: { id: string; name: string; slug: string | null; price_cents: number | null } | null;
  metrics: { id: string; recorded_at: string }[];
  appointments: { id: string; scheduled_at: string; status: string }[];
  error?: string;
};

export type SponsoredPatientState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'loaded'; data: SponsoredPatientResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useUserSponsoredPatient(linkId: string): SponsoredPatientState {
  const [state, setState] = useState<SponsoredPatientState>({ status: 'loading', data: null, error: null });

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
        const res = await apiFetch(`/api/home/sponsored/${linkId}`, { accessToken });
        const json = (await res.json()) as SponsoredPatientApiResponse;
        if (!res.ok || json.error) {
          if (!cancelled) {
            setState({
              status: 'error',
              data: null,
              error: json.error || 'Failed to load patient.',
            });
          }
          return;
        }

        const now = new Date();
        const ageYears =
          json.patient?.date_of_birth != null
            ? Math.floor(
                (now.getTime() - new Date(json.patient.date_of_birth).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              )
            : null;

        const summary: SponsoredPatientResponse = {
          id: json.link.id,
          full_name: json.patient?.full_name ?? 'Patient',
          age_years: ageYears,
          plan_name: json.carePlan?.name ?? null,
          started_at: json.link.started_at,
          monthly_amount_cents: json.carePlan?.price_cents ?? null,
          total_visits: json.appointments?.length ?? 0,
          upcoming_visits:
            json.appointments?.filter((a) => new Date(a.scheduled_at).getTime() >= now.getTime()).length ?? 0,
          metrics_count: json.metrics?.length ?? 0,
        };

        if (!cancelled) {
          setState({ status: 'loaded', data: summary, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: 'Network error. Please try again.',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [linkId]);

  return state;
}

