import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { supabase } from './supabase';

export interface HomeAppointmentDetailResponse {
  appointment: {
    id: string;
    scheduled_at: string;
    status: 'Scheduled' | 'Completed';
  };
  patient: {
    id: string;
    full_name: string;
  };
  clinician: {
    id: string;
    full_name: string;
  };
}

export type UserHomeAppointmentState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'loaded'; data: HomeAppointmentDetailResponse; error: null }
  | { status: 'error'; data: null; error: string };

export function useUserHomeAppointment(appointmentId: string): UserHomeAppointmentState {
  const [state, setState] = useState<UserHomeAppointmentState>({ status: 'loading', data: null, error: null });

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
        const res = await apiFetch(`/api/home/appointments/${appointmentId}`, { accessToken });
        const json = (await res.json()) as HomeAppointmentDetailResponse & { error?: string };
        if (!res.ok || json.error) {
          if (!cancelled) setState({ status: 'error', data: null, error: json.error || 'Failed to load appointment.' });
          return;
        }
        if (!cancelled) setState({ status: 'loaded', data: json, error: null });
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, error: 'Network error. Please try again.' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  return state;
}

