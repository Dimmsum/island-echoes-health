import { supabase } from './supabase';

export type SignUpPayload = {
  email: string;
  password: string;
  role: 'patient' | 'sponsor';
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  organisation?: string;
  parish?: string;
};

export async function signUp(
  payload: SignUpPayload
): Promise<{ user: { id: string; email: string | undefined } } | { error: string }> {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      data: {
        role: payload.role,
        full_name: payload.full_name,
        phone: payload.phone ?? null,
        date_of_birth: payload.date_of_birth ?? null,
        organisation: payload.organisation ?? null,
        parish: payload.parish ?? null,
      },
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'No user returned' };
  return { user: { id: data.user.id, email: data.user.email } };
}

/** Resends the sign-up verification email (link) to the user. */
export async function resendVerificationEmail(email: string): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ session: unknown } | { error: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'email',
    email: email.trim(),
    token: token.trim(),
  });
  if (error) return { error: error.message };
  if (!data.session) return { error: 'Verification failed' };
  return { session: data.session };
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ session: unknown } | { error: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { error: error.message };
  if (!data.session) return { error: 'Sign in failed' };
  return { session: data.session };
}
