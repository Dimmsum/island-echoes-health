import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";
import {
  cancelSubscription,
  createSubscription,
  ensureCustomerForPaymentMethod,
  getOrCreatePriceForCarePlan,
} from "../lib/stripe.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function createConsentRequest(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { patientEmail, carePlanId } = req.body as { patientEmail?: string; carePlanId?: string };

  const email = (patientEmail as string)?.trim()?.toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Patient email is required." });
    return;
  }
  if (!carePlanId) {
    res.status(400).json({ error: "Care plan is required." });
    return;
  }

  const { data: plan } = await supabase.from("care_plans").select("id, name").eq("id", carePlanId).single();
  if (!plan) {
    res.status(400).json({ error: "Invalid plan." });
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  const sponsorName = profile?.full_name ?? "A sponsor";

  const { data: consentRequest, error: insertError } = await supabase
    .from("sponsorship_consent_requests")
    .insert({
      sponsor_id: userId,
      patient_email: email,
      care_plan_id: carePlanId,
      status: "pending",
      payment_simulated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    res.status(500).json({ error: "Failed to submit. Please try again." });
    return;
  }

  const admin = createClientAdmin();
  const { data: patientUserId } = await admin.rpc("get_user_id_by_email", { e: email });
  if (patientUserId) {
    await admin
      .from("sponsorship_consent_requests")
      .update({ patient_id: patientUserId })
      .eq("id", consentRequest.id);
    await createNotification(
      patientUserId,
      "consent_request",
      `${sponsorName} wants to sponsor your care`,
      `${sponsorName} has purchased the ${plan.name} plan for you. Accept to allow them to see your health information and appointment schedules.`,
      consentRequest.id
    );
  }

  res.json({ error: null, consentRequestId: consentRequest.id });
}

export async function acceptConsent(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { consentRequestId } = req.body as { consentRequestId?: string };
  if (!consentRequestId) {
    res.status(400).json({ error: "consentRequestId is required." });
    return;
  }

  const { data: request, error: fetchError } = await supabase
    .from("sponsorship_consent_requests")
    .select("id, sponsor_id, patient_id, care_plan_id, status, stripe_payment_method_id")
    .eq("id", consentRequestId)
    .single();

  if (fetchError || !request) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (request.patient_id !== userId) {
    res.status(403).json({ error: "You can only respond to your own consent requests." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ error: "This request was already responded to." });
    return;
  }
  if (!request.stripe_payment_method_id) {
    res.status(400).json({
      error: "Sponsor has not completed payment setup. They must add a payment method first.",
    });
    return;
  }

  const { data: carePlan } = await supabase
    .from("care_plans")
    .select("price_cents, stripe_price_id")
    .eq("id", request.care_plan_id)
    .single();
  if (!carePlan) {
    res.status(400).json({ error: "Plan not found." });
    return;
  }

  const { data: sponsorProfile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", request.sponsor_id)
    .single();

  const customerResult = await ensureCustomerForPaymentMethod(
    request.stripe_payment_method_id,
    sponsorProfile?.stripe_customer_id ?? null,
  );
  if ("error" in customerResult) {
    res.status(400).json({ error: customerResult.error });
    return;
  }

  if (customerResult.created) {
    await createClientAdmin()
      .from("profiles")
      .update({ stripe_customer_id: customerResult.customerId })
      .eq("id", request.sponsor_id);
  }

  const priceResult = await getOrCreatePriceForCarePlan(
    request.care_plan_id,
    carePlan.price_cents,
    carePlan.stripe_price_id ?? null,
  );
  if ("error" in priceResult) {
    res.status(400).json({ error: priceResult.error });
    return;
  }

  if (priceResult.created) {
    await createClientAdmin()
      .from("care_plans")
      .update({ stripe_price_id: priceResult.priceId })
      .eq("id", request.care_plan_id);
  }

  const subResult = await createSubscription({
    customerId: customerResult.customerId,
    paymentMethodId: request.stripe_payment_method_id,
    priceId: priceResult.priceId,
    metadata: {
      consent_request_id: consentRequestId,
      sponsor_id: request.sponsor_id,
      patient_id: request.patient_id,
      care_plan_id: request.care_plan_id,
    },
  });

  if ("error" in subResult) {
    res.status(400).json({ error: subResult.error });
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

  const { error: linkError } = await supabase.from("sponsor_patient_plans").insert({
    sponsor_id: request.sponsor_id,
    patient_id: request.patient_id,
    care_plan_id: request.care_plan_id,
    consent_request_id: consentRequestId,
    stripe_subscription_id: subResult.subscriptionId,
  });

  if (linkError) {
    res.status(500).json({ error: "Failed to link. Please try again." });
    return;
  }

  const { data: patientProfile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  const patientName = patientProfile?.full_name ?? "Your patient";

  await createNotification(
    request.sponsor_id,
    "sponsorship_accepted",
    "Sponsorship accepted",
    `${patientName} accepted your care plan sponsorship. You can now view their health information and appointment schedules.`,
    consentRequestId
  );

  res.json({ error: null });
}

export async function endSponsorship(req: AuthRequest, res: Response): Promise<void> {
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
    res.status(403).json({ error: "You can only end a sponsorship you are part of." });
    return;
  }

  if (plan.stripe_subscription_id) {
    const cancelResult = await cancelSubscription(plan.stripe_subscription_id);
    if ("error" in cancelResult) {
      console.error("cancelSubscription failed:", cancelResult.error);
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

export async function declineConsent(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { consentRequestId, declineReason } = req.body as { consentRequestId?: string; declineReason?: string };
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
    res.status(403).json({ error: "You can only respond to your own consent requests." });
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
