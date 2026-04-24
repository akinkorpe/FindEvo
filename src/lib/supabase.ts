import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
    browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

let serverClient: SupabaseClient | null = null;

/**
 * Server-side client. Uses the service role key when available (bypasses RLS);
 * otherwise falls back to the publishable key so local dev works with a single
 * key. Never import this into client components.
 */
export function getSupabaseServer(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL.",
    );
  }
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "Supabase is not configured. Provide SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (!serverClient) {
    serverClient = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false },
    });
  }
  return serverClient;
}
