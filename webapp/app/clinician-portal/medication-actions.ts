"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchFromApi } from "@/lib/api";

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

export async function createMedication(params: {
  patientId: string;
  name: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  notes?: string;
}): Promise<ClinicianActionResult> {
  const token = await getToken();
  if (!token) return { error: "Not signed in." };

  const res = await fetchFromApi(
    token,
    `/api/patients/${params.patientId}/medications`,
    {
      method: "POST",
      body: JSON.stringify({
        name: params.name,
        dosage: params.dosage,
        frequency: params.frequency,
        prescribedBy: params.prescribedBy,
        notes: params.notes,
      }),
    },
  );

  if (!res.ok) {
    return {
      error: await errorFromResponse(res, "Failed to record medication."),
    };
  }

  revalidatePath("/clinician-portal/appointments");
  return { error: null };
}

export async function endMedication(params: {
  patientId: string;
  medicationId: string;
  endedAt: string;
}): Promise<ClinicianActionResult> {
  const token = await getToken();
  if (!token) return { error: "Not signed in." };

  const res = await fetchFromApi(
    token,
    `/api/patients/${params.patientId}/medications/${params.medicationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ endedAt: params.endedAt }),
    },
  );

  if (!res.ok) {
    return {
      error: await errorFromResponse(res, "Failed to end medication."),
    };
  }

  revalidatePath("/clinician-portal/appointments");
  return { error: null };
}
