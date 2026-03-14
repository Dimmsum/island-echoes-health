import { Request, Response } from "express";
import { createClientAdmin } from "../lib/supabase.js";

const ALLOWED_LICENSE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type ReqWithFile = Request & { body?: Record<string, string>; file?: { originalname: string; mimetype: string; size: number; path: string } };

export async function submitClinicianRequest(req: ReqWithFile, res: Response): Promise<void> {
  const body = req.body ?? {};
  const file = req.file;
  const email = body?.email?.trim();
  const fullName = body?.name?.trim() || null;
  const licenseNumber = body?.license_number?.trim();
  const specialty = body?.specialty?.trim();
  const institutionOrClinicName = body?.institution_or_clinic_name?.trim() || null;

  if (!email) {
    res.status(400).json({ error: "Work email is required." });
    return;
  }
  if (!licenseNumber) {
    res.status(400).json({ error: "License number is required." });
    return;
  }
  if (!specialty) {
    res.status(400).json({ error: "Specialty is required." });
    return;
  }
  if (!file || !file.size) {
    res.status(400).json({ error: "Medical license image is required." });
    return;
  }
  if (!ALLOWED_LICENSE_TYPES.includes(file.mimetype)) {
    res.status(400).json({ error: "License must be an image (JPEG, PNG, WebP) or PDF." });
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    res.status(400).json({ error: "License file must be 5 MB or smaller." });
    return;
  }

  const admin = createClientAdmin();
  const { data: existing } = await admin
    .from("clinician_signup_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    res.status(400).json({
      error: "A sign-up request with this email is already pending. Please wait for an administrator to review it.",
    });
    return;
  }

  const path = `${crypto.randomUUID()}/${file.originalname}`;
  const fs = await import("fs/promises");
  const buffer = await fs.readFile(file.path);
  const { error: uploadError } = await admin.storage
    .from("clinician-licenses")
    .upload(path, buffer, { contentType: file.mimetype, upsert: false });
  await fs.unlink(file.path).catch(() => {});

  if (uploadError) {
    res.status(500).json({ error: "Failed to upload license image. Please try again." });
    return;
  }

  const { error: insertError } = await admin.from("clinician_signup_requests").insert({
    email,
    full_name: fullName,
    license_number: licenseNumber,
    specialty,
    institution_or_clinic_name: institutionOrClinicName,
    license_image_path: path,
    status: "pending",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      res.status(400).json({
        error: "A sign-up request with this email already exists. Please wait for an administrator to review it.",
      });
      return;
    }
    res.status(500).json({ error: "Failed to submit request. Please try again." });
    return;
  }
  res.status(201).json({ error: null, message: "Request submitted." });
}
