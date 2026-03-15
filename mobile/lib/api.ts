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
