# Island Echoes Health – API Server

Express API server for Island Echoes Health. It talks to Supabase (database and auth) and is used by the web app and (later) the mobile app. **Phase 1:** APIs only; the Next.js web app still uses the database directly. In Phase 2, the web app will call this API instead.

## Postman

Import **`Island-Echoes-Health-API.postman_collection.json`** into Postman to test all endpoints. Set the collection variable **`access_token`** to your Supabase session access token (from the web app or Supabase Auth) for protected routes. Use **`baseUrl`** (default `http://localhost:4001`) if your API runs on a different host/port.

## Run locally

```bash
cd api
npm install
npm run dev
```

Server runs at **http://localhost:4001** by default (or set `PORT` env var, e.g. `PORT=4000`).

## Environment variables

Copy from the web app or set:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (admin operations)
- `NEXT_PUBLIC_APP_URL` or `APP_URL` – Base URL for emails (e.g. password reset redirect)
- `CORS_ORIGIN` – (optional) Allowed origin for CORS; default allows all
- `PORT` – (optional) Port; default 4001 (use 4000 if you prefer, e.g. when nothing else is using it)

## Auth

- **No login/signup in the API.** Clients use Supabase Auth (sign in/up) and send the session access token on each request.
- **Protected routes** require header: `Authorization: Bearer <access_token>`.
- The API validates the token with Supabase and uses it for RLS-scoped DB access. Admin routes use the service role after checking the user’s role.

## Endpoints (base path `/api`)

- `GET /health` – Health check
- `GET /me` – Current user + profile
- `GET /care-plans` – List care plans
- `GET /home`, `GET /home/profile`, `GET /home/sponsored/:id`, `GET /home/appointments`, `GET /home/appointments/:id` – Home dashboard and related reads
- `POST /sponsorship/consent-requests`, `POST /sponsorship/accept`, `POST /sponsorship/decline` – Sponsorship flow
- `PATCH /notifications/:id/read`, `DELETE /notifications` – Notifications
- `PATCH /profile`, `POST /profile/avatar` – Profile (avatar is multipart)
- `GET /admin/clinicians`, `GET /admin/pending-requests`, `POST /admin/approve`, `POST /admin/reject` – Admin (admin role only)
- `POST /clinician/request` – Submit clinician signup (no auth; multipart form)
- `GET /clinician-portal`, `GET /clinician-portal/appointments`, `GET /clinician-portal/appointments/:id`, `GET /clinician-portal/profile` – Clinician portal reads (clinician or admin)
- `POST /appointments`, `PATCH /appointments/:id/status`, `PATCH /appointments/:id/reschedule`, `POST /appointments/:id/notes`, `POST /appointments/:id/services`, `POST /appointments/:id/metrics` – Appointments (clinician or admin)

Errors return JSON `{ error: string }`. Success responses return JSON with the requested data or `{ error: null }`.
