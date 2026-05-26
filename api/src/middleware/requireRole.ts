import { Request, Response, NextFunction } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "./auth.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthRequest;
  try {
    const { data: profile } = await createSupabaseForUser(authReq.accessToken)
      .from("profiles")
      .select("role")
      .eq("id", authReq.user.id)
      .single();
    if (profile?.role !== "admin") {
      res.status(403).json({ error: "Not authorized." });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Failed to check role." });
  }
}

export async function requireClinicianOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthRequest;
  try {
    const { data: profile } = await createSupabaseForUser(authReq.accessToken)
      .from("profiles")
      .select("role")
      .eq("id", authReq.user.id)
      .single();
    const role = profile?.role;
    if (role !== "clinician" && role !== "admin") {
      res.status(403).json({ error: "Not authorized." });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Failed to check role." });
  }
}
