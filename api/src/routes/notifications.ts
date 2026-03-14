import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const rawLimit = req.query.limit != null ? Number(req.query.limit) : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, Math.floor(rawLimit)), MAX_LIMIT);

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, read_at, created_at, reference_id")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ error: "Failed to fetch notifications." });
    return;
  }
  res.json({ notifications: notifications ?? [] });
}

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
