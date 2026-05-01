import { NextResponse } from "next/server";
import { getSupabaseRSC } from "@/lib/supabase.server";

export const dynamic = "force-dynamic";

/**
 * OAuth / email-confirmation callback.
 *
 * With PKCE flow Supabase redirects here with `?code=…`. We exchange the code
 * for a cookie-bound session and then send the user to `next` (defaults to
 * "/", which routes to /dashboard or /landing based on product state).
 *
 * Errors come back as `?error=…&error_description=…`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    const target = new URL("/signin", url.origin);
    target.searchParams.set("error", errorDescription);
    return NextResponse.redirect(target);
  }

  if (!code) {
    const target = new URL("/signin", url.origin);
    target.searchParams.set("error", "Missing authorization code.");
    return NextResponse.redirect(target);
  }

  const sb = await getSupabaseRSC();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    const target = new URL("/signin", url.origin);
    target.searchParams.set("error", error.message);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
