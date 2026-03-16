import { apiFetch } from './api';
import { supabase } from './supabase';

export async function createPaymentForPlanMobile(
  patientEmail: string,
  carePlanId: string
): Promise<{ clientSecret: string; publishableKey?: string } | { error: string }> {
  const trimmedEmail = patientEmail.trim().toLowerCase();
  if (!trimmedEmail) return { error: 'Patient email is required.' };
  if (!carePlanId) return { error: 'Care plan is required.' };

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { error: 'Not signed in.' };

  const res = await apiFetch('/api/sponsorship/create-payment', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ patientEmail: trimmedEmail, carePlanId }),
  });
  const json = (await res.json().catch(() => ({}))) as
    | { clientSecret?: string; publishableKey?: string; error?: string }
    | undefined;

  if (!res.ok || !json || json.error) {
    return { error: json?.error || 'Failed to start payment. Please try again.' };
  }
  if (!json.clientSecret) {
    return { error: 'Invalid response from server (missing clientSecret).' };
  }
  return { clientSecret: json.clientSecret, publishableKey: json.publishableKey };
}


