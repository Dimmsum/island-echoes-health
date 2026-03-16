/**
 * API client for Island Echoes Health backend.
 * Set EXPO_PUBLIC_API_URL for the API server. For authenticated requests, pass the Supabase access token.
 */
export const API_BASE =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
    ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '')
    : 'http://localhost:4001';

export async function apiFetch(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<Response> {
  const { accessToken, ...init } = options;
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers as Record<string, string>),
    },
  });
}

export type SubmitClinicianRequestParams = {
  email: string;
  name?: string | null;
  license_number: string;
  specialty: string;
  institution_or_clinic_name?: string | null;
  license_image_uri: string;
  license_image_mime?: string;
  license_image_name?: string;
};

/** Submit clinician sign-up request (no auth). Multipart POST to /api/clinician/request. */
export async function submitClinicianRequest(
  params: SubmitClinicianRequestParams
): Promise<{ ok: true } | { error: string }> {
  const url = `${API_BASE}/api/clinician/request`;
  const formData = new FormData();
  formData.append('email', params.email.trim());
  formData.append('license_number', params.license_number.trim());
  formData.append('specialty', params.specialty.trim());
  if (params.name?.trim()) formData.append('name', params.name.trim());
  if (params.institution_or_clinic_name?.trim()) {
    formData.append('institution_or_clinic_name', params.institution_or_clinic_name.trim());
  }
  formData.append('license_image', {
    uri: params.license_image_uri,
    type: params.license_image_mime || 'image/jpeg',
    name: params.license_image_name || 'license.jpg',
  } as unknown as Blob);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      // Do not set Content-Type; fetch sets multipart/form-data with boundary
    },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) {
    return { error: data?.error || `Request failed (${res.status})` };
  }
  return { ok: true };
}
