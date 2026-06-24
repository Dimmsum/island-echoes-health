"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchFromApi } from "@/lib/api";
import type { StatusUpdateVisibility } from "./status-update-types";

export type ClinicianActionResult = { error: string | null };

async function getToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Pull the API's `{ error }` message out of a failed response, with a fallback. */
async function errorFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export async function createStatusUpdate(params: {
  patientId: string;
  statusText: string;
  visibility: StatusUpdateVisibility;
}): Promise<ClinicianActionResult> {
  const token = await getToken();
  if (!token) return { error: "Not signed in." };

  const res = await fetchFromApi(
    token,
    `/api/patients/${params.patientId}/status-updates`,
    {
      method: "POST",
      body: JSON.stringify({
        statusText: params.statusText,
        visibility: params.visibility,
      }),
    },
  );

  if (!res.ok) {
    return {
      error: await errorFromResponse(res, "Failed to post status update."),
    };
  }

  revalidatePath("/clinician-portal/appointments");
  return { error: null };
}
