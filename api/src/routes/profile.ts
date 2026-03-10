import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024;

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const { fullName } = req.body as { fullName?: string | null };
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.user.id);
  if (error) {
    res.status(500).json({ error: "Failed to update profile." });
    return;
  }
  res.json({ error: null });
}

export async function uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const file = (req as unknown as { file?: { fieldname: string; originalname: string; mimetype: string; size: number; path: string } }).file;
  if (!file || !file.size) {
    res.status(400).json({ error: "Please select an image." });
    return;
  }
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    res.status(400).json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." });
    return;
  }
  if (file.size > MAX_SIZE) {
    res.status(400).json({ error: "Image must be under 2 MB." });
    return;
  }
  const ext = file.originalname.split(".").pop() || "jpg";
  const path = `${req.user.id}/avatar.${ext}`;

  const fs = await import("fs/promises");
  const buffer = await fs.readFile(file.path);
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, buffer, { upsert: true, contentType: file.mimetype });
  await fs.unlink(file.path).catch(() => {});

  if (uploadError) {
    res.status(500).json({ error: "Failed to upload image. Please try again." });
    return;
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const baseUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: baseUrl, updated_at: new Date().toISOString() })
    .eq("id", req.user.id);

  if (updateError) {
    res.status(500).json({ error: "Image uploaded but failed to save. Please try again." });
    return;
  }
  res.json({ error: null, url: `${baseUrl}?t=${Date.now()}` });
}
