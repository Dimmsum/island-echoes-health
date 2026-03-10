import { Request, Response, NextFunction } from "express";
import { getUserFromToken } from "../lib/supabase.js";
import type { User } from "@supabase/supabase-js";

export type AuthRequest = Request & { user: User; accessToken: string };

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }
  (req as AuthRequest).user = user;
  (req as AuthRequest).accessToken = token;
  next();
}
