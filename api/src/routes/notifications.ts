import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const notificationId = req.params.id;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", req.user.id);
  if (error) {
    res.status(500).json({ error: "Failed to mark as read." });
    return;
  }
  res.json({ error: null });
}

export async function clearAll(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const { error } = await supabase.from("notifications").delete().eq("user_id", req.user.id);
  if (error) {
    res.status(500).json({ error: "Failed to clear notifications." });
    return;
  }
  res.json({ error: null });
}
