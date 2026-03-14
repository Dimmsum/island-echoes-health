import { Request, Response } from "express";
import { signInWithPassword } from "../lib/supabase.js";

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
