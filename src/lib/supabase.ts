import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return browserClient;
}

let adminClient: SupabaseClient | null = null;

/**
 * Admin client using the service role key. Bypasses RLS — use only for
 * trusted server-only operations (cron, ingestion, system jobs). Never use
 * for user-driven requests; prefer getSupabaseRSC() so RLS applies.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations.");
  }
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/**
 * Backwards-compatible alias for legacy callers (repositories). Returns the
 * admin client (service role) — bypasses RLS, so application code MUST scope
 * by owner_id where relevant. New code should prefer getSupabaseRSC() from
 * "@/lib/supabase.server".
 */
export function getSupabaseServer(): SupabaseClient {
  return getSupabaseAdmin();
}

/**
 * Build a server client wired to a specific cookie pair (for use inside
 * middleware where the request/response objects own cookie I/O).
 */
export function createMiddlewareSupabase(
  getAll: () => { name: string; value: string }[],
  setAll: (
    cookies: { name: string; value: string; options: CookieOptions }[],
  ) => void,
): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll, setAll },
  });
}

export const SUPABASE_PUBLIC_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_PUBLISHABLE_KEY,
};
