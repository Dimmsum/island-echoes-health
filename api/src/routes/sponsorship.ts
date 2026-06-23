import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";
import { cancelSubscription } from "../lib/stripe.js";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * POST /api/sponsorship/invite
 * Body: { patientEmail }
 * Sponsor invites a patient by email. Creates a pending consent request (no Stripe required).
 * Notifies the patient if they already have an account.
 */
export async function createSponsorshipInvite(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { patientEmail } = req.body as { patientEmail?: string };

  const email = (patientEmail as string)?.trim()?.toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Patient email is required." });
    return;
  }

  // Auto-fetch the single sponsorship plan as the FK anchor on consent requests.
  const admin = createClientAdmin();
  const { data: plan } = await admin
    .from("care_plans")
    .select("id")
    .eq("slug", "sponsorship")
    .single();

  if (!plan) {
    res.status(500).json({ error: "Sponsorship plan not configured." });
    return;
  }

  const { data: sponsorProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  const sponsorName = sponsorProfile?.full_name ?? "A sponsor";

  const { data: consentRequest, error: insertError } = await supabase
    .from("sponsorship_consent_requests")
    .insert({
      sponsor_id: userId,
      patient_email: email,
      care_plan_id: plan.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    res.status(500).json({ error: "Failed to create invite. Please try again." });
    return;
  }

  // Notify patient if they already have an account.
  const { data: patientUserId } = await admin.rpc("get_user_id_by_email", {
    e: email,
  });

  if (patientUserId) {
    await admin
      .from("sponsorship_consent_requests")
      .update({ patient_id: patientUserId })
      .eq("id", consentRequest.id);

    await createNotification(
      patientUserId,
      "consent_request",
      `${sponsorName} wants to support your care`,
      `${sponsorName} has sent you a sponsorship request. Accept to allow them to see your health information and contribute to your care wallet.`,
      consentRequest.id,
    );
  }

  res.status(201).json({ error: null, consentRequestId: consentRequest.id });
}

/**
 * POST /api/sponsorship/accept
 * Body: { consentRequestId }
 * Patient accepts a pending sponsorship invite. Creates the sponsor-patient link (no Stripe).
 */
export async function acceptConsent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { consentRequestId } = req.body as { consentRequestId?: string };

  if (!consentRequestId) {
    res.status(400).json({ error: "consentRequestId is required." });
    return;
  }

  const { data: request, error: fetchError } = await supabase
    .from("sponsorship_consent_requests")
    .select("id, sponsor_id, patient_id, care_plan_id, status")
    .eq("id", consentRequestId)
    .single();

  if (fetchError || !request) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (request.patient_id !== userId) {
    res
      .status(403)
      .json({ error: "You can only respond to your own consent requests." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "This request was already responded to." });
    return;
  }

  const { error: updateError } = await supabase
    .from("sponsorship_consent_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", consentRequestId);

  if (updateError) {
    res.status(500).json({ error: "Failed to accept." });
    return;
  }

  const { error: linkError } = await supabase
    .from("sponsor_patient_plans")
    .insert({
      sponsor_id: request.sponsor_id,
      patient_id: request.patient_id,
      care_plan_id: request.care_plan_id,
      consent_request_id: consentRequestId,
    });

  if (linkError) {
    res.status(500).json({ error: "Failed to link. Please try again." });
    return;
  }

  const { data: patientProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  const patientName = patientProfile?.full_name ?? "Your patient";

  await createNotification(
    request.sponsor_id,
    "sponsorship_accepted",
    "Sponsorship accepted",
    `${patientName} accepted your sponsorship request. You can now view their health information and contribute to their care wallet.`,
    consentRequestId,
  );

  res.json({ error: null });
}

/**
 * POST /api/sponsorship/end
 * Body: { planId }
 * Sponsor or patient ends an active sponsorship.
 * Cancels the Stripe subscription if one exists (legacy sponsorships only).
 */
export async function endSponsorship(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { planId } = req.body as { planId?: string };

  if (!planId) {
    res.status(400).json({ error: "planId is required." });
    return;
  }

  const { data: plan, error: fetchError } = await supabase
    .from("sponsor_patient_plans")
    .select("id, sponsor_id, patient_id, stripe_subscription_id")
    .eq("id", planId)
    .is("ended_at", null)
    .single();

  if (fetchError || !plan) {
    res.status(404).json({ error: "Plan not found or already ended." });
    return;
  }

  if (plan.sponsor_id !== userId && plan.patient_id !== userId) {
    res
      .status(403)
      .json({ error: "You can only end a sponsorship you are part of." });
    return;
  }

  if (plan.stripe_subscription_id) {
    const cancelResult = await cancelSubscription(plan.stripe_subscription_id);
    if ("error" in cancelResult) {
      console.error("cancelSubscription failed:", cancelResult.error);
      res.status(502).json({
        error:
          "Unable to cancel Stripe subscription right now. Sponsorship was not ended. Please try again.",
      });
      return;
    }
  }

  const { error: updateError } = await createClientAdmin()
    .from("sponsor_patient_plans")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", planId);

  if (updateError) {
    res.status(500).json({ error: "Failed to end sponsorship." });
    return;
  }

  res.json({ error: null });
}

/**
 * POST /api/sponsorship/decline
 * Body: { consentRequestId, declineReason? }
 * Patient declines a pending sponsorship invite.
 */
export async function declineConsent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { consentRequestId, declineReason } = req.body as {
    consentRequestId?: string;
    declineReason?: string;
  };

  if (!consentRequestId) {
    res.status(400).json({ error: "consentRequestId is required." });
    return;
  }

  const { data: request } = await supabase
    .from("sponsorship_consent_requests")
    .select("id, patient_id, status")
    .eq("id", consentRequestId)
    .single();

  if (!request) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (request.patient_id !== userId) {
    res
      .status(403)
      .json({ error: "You can only respond to your own consent requests." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "This request was already responded to." });
    return;
  }

  const { error } = await supabase
    .from("sponsorship_consent_requests")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
      decline_reason: declineReason?.trim() || null,
    })
    .eq("id", consentRequestId);

  if (error) {
    res.status(500).json({ error: "Failed to decline." });
    return;
  }

  res.json({ error: null });
}
