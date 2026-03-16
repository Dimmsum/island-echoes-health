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

type ApiResult = { error?: string | null } | undefined;

async function postConsentAction(
  path: '/api/sponsorship/accept' | '/api/sponsorship/decline',
  body: Record<string, string | undefined>
): Promise<{ error: string | null }> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { error: 'Not signed in.' };

  const res = await apiFetch(path, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as ApiResult;
  if (!res.ok || json?.error) {
    return { error: json?.error || 'Something went wrong. Please try again.' };
  }
  return { error: null };
}

export async function acceptConsentRequestMobile(consentRequestId: string): Promise<{ error: string | null }> {
  if (!consentRequestId) return { error: 'Missing consent request.' };
  return postConsentAction('/api/sponsorship/accept', { consentRequestId });
}

export async function declineConsentRequestMobile(
  consentRequestId: string,
  declineReason?: string
): Promise<{ error: string | null }> {
  if (!consentRequestId) return { error: 'Missing consent request.' };
  return postConsentAction('/api/sponsorship/decline', { consentRequestId, declineReason });
}

