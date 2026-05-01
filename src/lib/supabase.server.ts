import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_PUBLIC_CONFIG } from "./supabase";

/**
 * RLS-aware server client bound to the current request's cookies. Use this
 * inside Server Components, Route Handlers, and Server Actions when you want
 * queries scoped to the signed-in user (auth.uid() inside RLS policies).
 *
 * IMPORTANT: this module imports next/headers — never import it from a
 * Client Component or a file shared with the browser bundle.
 */
export async function getSupabaseRSC(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const store = await cookies();
  return createServerClient(SUPABASE_PUBLIC_CONFIG.url, SUPABASE_PUBLIC_CONFIG.anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies — ignored. Middleware refreshes the cookie.
        }
      },
    },
  });
}
