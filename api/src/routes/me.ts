import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, phone")
    .eq("id", req.user.id)
    .single();
  res.json({
    user: { id: req.user.id, email: req.user.email },
    profile: profile ?? null,
  });
}
