import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function listCarePlans(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const { data, error } = await supabase
    .from("care_plans")
    .select("id, name, slug, price_cents, features")
    .order("price_cents", { ascending: true });
  if (error) {
    res.status(500).json({ error: "Failed to load care plans." });
    return;
  }
  res.json({ carePlans: data ?? [] });
}
