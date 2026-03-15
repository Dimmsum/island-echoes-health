import { Request, Response } from "express";
import { signInWithPassword, signUp, sendOtp, verifyOtp, type SignUpMetadata } from "../lib/supabase.js";

export async function signIn(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const result = await signInWithPassword(String(email).trim(), String(password));
  if ("error" in result) {
    res.status(401).json({ error: result.error });
    return;
  }
  res.json({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
    expires_at: result.session.expires_at,
    user: {
      id: result.user.id,
      email: result.user.email,
    },
  });
}

const PATIENT_SPONSOR = ["patient", "sponsor"] as const;

export async function signUpRoute(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  const {
    email,
    password,
    role,
    full_name,
    phone,
    date_of_birth,
    organisation,
    parish,
  } = body;

  if (!email || !password || !role || !full_name) {
    res.status(400).json({ error: "email, password, role, and full_name are required" });
    return;
  }
  if (!PATIENT_SPONSOR.includes(role)) {
    res.status(400).json({ error: "role must be patient or sponsor" });
    return;
  }

  const metadata: SignUpMetadata = {
    role,
    full_name: String(full_name).trim(),
    phone: phone != null ? String(phone).trim() : undefined,
    date_of_birth: date_of_birth != null ? String(date_of_birth).trim() : undefined,
    organisation: organisation != null ? String(organisation).trim() : undefined,
    parish: parish != null ? String(parish).trim() : undefined,
  };

  console.log("[auth/sign-up] Request", {
    email: String(email).trim(),
    role: metadata.role,
    full_name: metadata.full_name,
    hasPhone: !!metadata.phone,
    date_of_birth: metadata.date_of_birth,
    organisation: metadata.organisation,
    parish: metadata.parish,
  });

  const result = await signUp(String(email).trim(), String(password), metadata);
  if ("error" in result) {
    console.error("[auth/sign-up] Sign-up failed:", result.error);
    res.status(400).json({ error: result.error });
    return;
  }
  console.log("[auth/sign-up] Success", { userId: result.user.id, email: result.user.email });
  res.status(201).json({
    user: { id: result.user.id, email: result.user.email },
    message: "Check your email for a verification code.",
  });
}

export async function sendOtpRoute(req: Request, res: Response): Promise<void> {
  const { email } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const result = await sendOtp(String(email).trim());
  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ message: "Verification code sent." });
}

export async function verifyOtpRoute(req: Request, res: Response): Promise<void> {
  const { email, token } = req.body ?? {};
  if (!email || !token) {
    res.status(400).json({ error: "email and token are required" });
    return;
  }
  const result = await verifyOtp(String(email).trim(), String(token).trim());
  if ("error" in result) {
    res.status(401).json({ error: result.error });
    return;
  }
  res.json({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
    expires_at: result.session.expires_at,
    user: { id: result.user.id, email: result.user.email },
  });
}
