"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchFromApi } from "@/lib/api";

export async function bookAppointment(
  clinicianId: string,
  scheduledAt: string,
  appointmentType: string,
  patientNotes: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated." };

  const res = await fetchFromApi(session.access_token, "/api/appointments/request", {
    method: "POST",
    body: JSON.stringify({ clinicianId, scheduledAt, appointmentType: appointmentType || null, patientNotes: patientNotes || null }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: (body as { error?: string }).error ?? "Failed to book appointment." };
  }

  revalidatePath("/appointments");
  revalidatePath("/home");
  return { error: null };
}
