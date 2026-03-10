# Webapp → API migration notes

Goal: have the Next.js webapp use the backend API for all data (and eventually auth), instead of talking to Supabase directly. This separates client and server, reduces single point of failure, and centralizes security in the API.

**Auth model:** Supabase remains the source of truth for identity; the webapp gets an access token (via cookies/session) and sends `Authorization: Bearer <token>` to the API. The API validates the token with Supabase and then serves data from its own Supabase client.

---

## Plan (steps)

| Step | Scope | Status |
|------|--------|--------|
| **1** | API base URL, fetch helper, and **user home** pages: `/home`, `/home/profile`, `/home/appointments`, `/home/appointments/[id]`, `/home/sponsored/[id]` | **Done** |
| **2** | Clinician/admin dashboards: `/clinician-portal`, `/clinician-portal/appointments`, `/clinician-portal/appointments/[id]`, `/clinician-portal/profile` | Pending |
| **3** | Auth flows: sign-in, sign-out, “me” — use `/api/auth/sign-in` and `/api/me` where appropriate; keep cookie/session handling as needed | Pending |
| **4** | Server actions: move create/update operations (appointments, notes, metrics, sponsorship, etc.) to API calls from the client | Pending |

---

## Step 1 — User home pages

**Objective:** Switch `/home`, `/home/profile`, `/home/appointments`, `/home/appointments/[id]`, and `/home/sponsored/[id]` to load data from the API instead of direct Supabase queries.

**Done:**

- [x] Add `NEXT_PUBLIC_API_URL` to webapp `.env` and create `webapp/lib/api.ts` (base URL + `fetchFromApi` / `fetchApiJson`).
- [x] `/home` (app/home/page.tsx): get session (Supabase server), then `GET /api/home` with Bearer token; render from API response.
- [x] `/home/profile`: get session, then `GET /api/me` + `GET /api/home/profile`; render from API responses.
- [x] `/home/appointments`: get session, then `GET /api/clinician-portal/appointments` (staff only); render from API response.
- [x] `/home/appointments/[id]`: get session, then `GET /api/home/appointments/:id`; render from API response.
- [x] `/home/sponsored/[id]`: get session, then `GET /api/home/sponsored/:id`; render from API response. Note: appointment notes are not returned by this API yet, so the sponsored patient page shows an empty notes list for each appointment (full notes still appear on the appointment detail page).

**Notes:**

- Supabase server client is still used only to get the current user/session and access token (and a single `profiles.role` query where we need to redirect staff before calling the API).
- API routes used: `GET /api/home`, `GET /api/me`, `GET /api/home/profile`, `GET /api/home/appointments`, `GET /api/home/appointments/:id`, `GET /api/home/sponsored/:id`, `GET /api/clinician-portal/appointments`.

---

## Step 2 — Clinician portal

**Objective:** Switch clinician-portal pages to use API.

**Done:** (to be filled when done)

---

## Step 3 — Auth flows

**Objective:** Sign-in / sign-out / “me” via API where applicable.

**Done:** (to be filled when done)

---

## Step 4 — Server actions → API

**Objective:** Replace direct Supabase in server actions with API calls.

**Done:** (to be filled when done)
