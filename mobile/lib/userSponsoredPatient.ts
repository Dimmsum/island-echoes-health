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
        const res = await apiFetch(`/api/home/patient/${linkId}`, { accessToken });
        const json = (await res.json()) as SponsoredPatientResponse & { error?: string };
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

        if (!cancelled) {
          setState({ status: 'loaded', data: json, error: null });
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

