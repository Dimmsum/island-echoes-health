"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchFromApi } from "@/lib/api";
import type { FollowUpStatus } from "./follow-up-types";

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

function revalidateFollowUpPaths(appointmentId?: string | null) {
  revalidatePath("/clinician-portal");
  revalidatePath("/clinician-portal/appointments");
  if (appointmentId) {
    revalidatePath("/clinician-portal/appointments/" + appointmentId);
  }
}

export async function createFollowUp(params: {
  patientId: string;
  dueDate: string;
  notes?: string;
  appointmentId?: string;
}): Promise<ClinicianActionResult> {
  const token = await getToken();
  if (!token) return { error: "Not signed in." };

  const res = await fetchFromApi(token, "/api/follow-ups", {
    method: "POST",
    body: JSON.stringify({
      patientId: params.patientId,
      dueDate: params.dueDate,
      notes: params.notes,
      appointmentId: params.appointmentId,
    }),
  });

  if (!res.ok) {
    return { error: await errorFromResponse(res, "Failed to create follow-up.") };
  }

  revalidateFollowUpPaths(params.appointmentId);
  return { error: null };
}

export async function updateFollowUp(
  id: string,
  changes: { status?: FollowUpStatus; notes?: string },
  appointmentId?: string,
): Promise<ClinicianActionResult> {
  const token = await getToken();
  if (!token) return { error: "Not signed in." };

  const res = await fetchFromApi(token, `/api/follow-ups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });

  if (!res.ok) {
    return { error: await errorFromResponse(res, "Failed to update follow-up.") };
  }

  revalidateFollowUpPaths(appointmentId);
  return { error: null };
}
