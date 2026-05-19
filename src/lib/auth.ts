import { getSupabaseBrowser } from "@/lib/supabase";

export type AuthMode = "signin" | "signup";

export type FieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed.length > 254) return "Email is too long.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email.";
  return undefined;
}

export function validatePassword(password: string, mode: AuthMode): string | undefined {
  if (!password) return "Password is required.";
  if (mode === "signin") return undefined;
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  return undefined;
}

export function validate(email: string, password: string, mode: AuthMode): FieldErrors {
  return {
    email: validateEmail(email),
    password: validatePassword(password, mode),
  };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Boolean(errors.email || errors.password);
}

/**
 * Maps Supabase auth errors to short, user-facing English strings.
 * Supabase error codes: https://supabase.com/docs/reference/javascript/auth-api
 */
export function mapAuthError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Invalid email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email address.";
  if (m.includes("user already registered")) return "This email is already registered.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a moment.";
  if (m.includes("password")) return "Password rejected. Check the requirements.";
  if (m.includes("network")) return "Connection error. Check your internet.";
  return message;
}

export async function signInWithPassword(email: string, password: string) {
  const sb = getSupabaseBrowser();
  return sb.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpWithPassword(email: string, password: string) {
  const sb = getSupabaseBrowser();
  return sb.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
    },
  });
}

/**
 * Re-send the email confirmation link to a pending signup. Used when the
 * verification email gets lost / goes to spam — without this the user has
 * no way out of the "click the link" screen.
 */
export async function resendSignupConfirmation(email: string) {
  const sb = getSupabaseBrowser();
  return sb.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
    },
  });
}

/**
 * Send a "reset your password" email to the address. Supabase generates a
 * single-use token, delivers it via the auth email template, and the link
 * lands back on /auth/callback?code=… which redirects to /auth/reset-password.
 *
 * Returns the raw `{ error }` so the caller can map the message — we never
 * disclose whether the email exists (Supabase already obscures that by
 * returning success either way).
 */
export async function sendPasswordReset(email: string) {
  const sb = getSupabaseBrowser();
  return sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
  });
}

/**
 * Set a new password on the currently-authenticated session. Used by the
 * reset-password page after the user lands there with a Supabase recovery
 * session active.
 */
export async function updatePassword(newPassword: string) {
  const sb = getSupabaseBrowser();
  return sb.auth.updateUser({ password: newPassword });
}

export async function signInWithGoogle(next: string = "/") {
  const sb = getSupabaseBrowser();
  return sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
}

export async function signOut() {
  const sb = getSupabaseBrowser();
  return sb.auth.signOut();
}
