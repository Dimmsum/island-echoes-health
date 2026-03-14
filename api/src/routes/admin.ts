import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const TEMP_PASSWORD_LENGTH = 24;

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let s = "";
  const bytes = new Uint8Array(TEMP_PASSWORD_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    s += chars[bytes[i]! % chars.length];
  }
  return s;
}

export async function getClinicians(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const { data: clinicians, error } = await supabase.rpc("get_clinician_users");
  if (error) {
    res.status(500).json({ error: "Failed to fetch clinicians." });
    return;
  }
  res.json({ clinicians: clinicians ?? [] });
}

export async function getPendingRequests(req: AuthRequest, res: Response): Promise<void> {
  const admin = createClientAdmin();
  const { data: pendingList, error } = await admin
    .from("clinician_signup_requests")
    .select("id, email, full_name, license_number, specialty, institution_or_clinic_name, license_image_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: "Failed to fetch requests." });
    return;
  }
  const rows = pendingList ?? [];
  const withUrls = await Promise.all(
    rows.map(async (row) => {
      let license_image_url: string | null = null;
      if (row.license_image_path) {
        const { data } = await admin.storage.from("clinician-licenses").createSignedUrl(row.license_image_path, 3600);
        license_image_url = data?.signedUrl ?? null;
      }
      return { ...row, license_image_url };
    })
  );
  res.json({ requests: withUrls });
}

export async function approveRequest(req: AuthRequest, res: Response): Promise<void> {
  const { requestId } = req.body as { requestId?: string };
  if (!requestId) {
    res.status(400).json({ error: "requestId is required." });
    return;
  }

  const admin = createClientAdmin();
  const { data: request, error: fetchError } = await admin
    .from("clinician_signup_requests")
    .select("id, email, full_name, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "Request was already reviewed." });
    return;
  }

  const tempPassword = randomPassword();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: request.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: request.full_name ?? undefined, role: "clinician" },
  });

  if (createError) {
    if (createError.message.includes("already been registered")) {
      await admin
        .from("clinician_signup_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: req.user.id,
        })
        .eq("id", requestId);
      res.json({ error: null });
      return;
    }
    res.status(400).json({ error: createError.message });
    return;
  }

  await admin.auth.resetPasswordForEmail(request.email, { redirectTo: `${appUrl}/clinician` });

  const { error: updateError } = await admin
    .from("clinician_signup_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: req.user.id,
    })
    .eq("id", requestId);

  if (updateError) {
    res.status(500).json({ error: "Failed to update request status." });
    return;
  }
  res.json({ error: null });
}

export async function rejectRequest(req: AuthRequest, res: Response): Promise<void> {
  const { requestId } = req.body as { requestId?: string };
  if (!requestId) {
    res.status(400).json({ error: "requestId is required." });
    return;
  }

  const admin = createClientAdmin();
  const { data: request, error: fetchError } = await admin
    .from("clinician_signup_requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "Request was already reviewed." });
    return;
  }

  const { error: updateError } = await admin
    .from("clinician_signup_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: req.user.id,
    })
    .eq("id", requestId);

  if (updateError) {
    res.status(500).json({ error: "Failed to update request status." });
    return;
  }
  res.json({ error: null });
}
