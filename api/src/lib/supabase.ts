import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAnonClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseForUser(accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createClientAdmin(): SupabaseClient {
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUserFromToken(accessToken: string): Promise<User | null> {
  const supabase = getAnonClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ session: Session; user: User } | { error: string }> {
  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  if (!data.session || !data.user) return { error: "No session returned" };
  return { session: data.session, user: data.user };
}

export type SignUpMetadata = {
  role: "patient" | "sponsor";
  full_name: string;
  phone?: string;
  date_of_birth?: string; // YYYY-MM-DD
  organisation?: string;
  parish?: string;
};

export async function signUp(
  email: string,
  password: string,
  metadata: SignUpMetadata
): Promise<{ user: User; session: Session | null } | { error: string }> {
  const supabase = getAnonClient();
  const userMeta = {
    role: metadata.role,
    full_name: metadata.full_name,
    phone: metadata.phone ?? null,
    date_of_birth: metadata.date_of_birth ?? null,
    organisation: metadata.organisation ?? null,
    parish: metadata.parish ?? null,
  };
  console.log("[signUp] Creating user", { email: email.trim(), metadata: userMeta });

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: userMeta },
  });

  if (error) {
    console.error("[signUp] Supabase auth error:", {
      message: error.message,
      status: error.status,
      code: (error as { code?: string }).code,
      name: error.name,
      full: JSON.stringify(error, null, 2),
    });
    return { error: error.message };
  }
  if (!data.user) {
    console.error("[signUp] No user in response:", { data: JSON.stringify(data) });
    return { error: "No user returned" };
  }
  console.log("[signUp] User created", { id: data.user.id, email: data.user.email });
  return { user: data.user, session: data.session ?? null };
}

/** Sends a 6-digit OTP to the email (e.g. after sign-up for verification step). */
export async function sendOtp(email: string): Promise<{ ok: true } | { error: string }> {
  const supabase = getAnonClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: false },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ session: Session; user: User } | { error: string }> {
  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type: "email",
    email: email.trim(),
    token: token.trim(),
  });
  if (error) return { error: error.message };
  if (!data.session || !data.user) return { error: "Verification failed" };
  return { session: data.session, user: data.user };
}
