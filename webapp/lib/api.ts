/**
 * Client for the backend API. Use from server components or server actions
 * with the Supabase access token (from session).
 */
const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4001";

export function getApiBaseUrl(): string {
  return getBaseUrl();
}

export async function fetchFromApi(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${getBaseUrl()}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers });
}

export async function fetchApiJson<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetchFromApi(accessToken, path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
