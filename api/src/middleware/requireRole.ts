import { Response, NextFunction } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "./auth.js";

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: profile } = await createSupabaseForUser(req.accessToken)
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
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

export async function requireClinicianOrAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: profile } = await createSupabaseForUser(req.accessToken)
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
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
