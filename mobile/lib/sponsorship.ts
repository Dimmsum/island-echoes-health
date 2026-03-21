import { apiFetch } from './api';
import { supabase } from './supabase';

export async function createPaymentForPlanMobile(
  patientEmail: string,
  carePlanId: string
): Promise<{ checkoutUrl: string } | { error: string }> {
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
    | { checkoutUrl?: string; error?: string }
    | undefined;

  if (!res.ok || !json || json.error) {
    return { error: json?.error || 'Failed to start payment. Please try again.' };
  }
  if (!json.checkoutUrl) {
    return { error: 'Invalid response from server (missing checkoutUrl).' };
  }
  return { checkoutUrl: json.checkoutUrl };
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

export async function acceptConsentRequestMobile(
  consentRequestId: string
): Promise<{ error: string | null }> {
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

export async function getStripeCustomerPortalUrlMobile(): Promise<{
  url?: string;
  error: string | null;
}> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { error: 'Not signed in.' };

  const res = await apiFetch('/api/stripe/portal', {
    method: 'POST',
    accessToken,
  });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string } | undefined;
  if (!res.ok || !json || json.error || !json.url) {
    return { error: json?.error || 'Unable to open billing portal. Please try again.' };
  }
  return { url: json.url, error: null };
}

export async function getStripeSubscriptionPortalUrlMobile(planId: string): Promise<{
  url?: string;
  error: string | null;
}> {
  if (!planId) return { error: 'Missing sponsorship plan ID.' };

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { error: 'Not signed in.' };

  const res = await apiFetch('/api/stripe/portal/subscription', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ planId }),
  });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string } | undefined;
  if (!res.ok || !json || json.error || !json.url) {
    return { error: json?.error || 'Unable to open sponsorship billing portal. Please try again.' };
  }
  return { url: json.url, error: null };
}
