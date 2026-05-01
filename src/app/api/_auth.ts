import { getSupabaseRSC } from "@/lib/supabase.server";

export class UnauthorizedError extends Error {
  constructor(message = "Sign in required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Resolve the authenticated user from the request cookies. Throws
 * UnauthorizedError if no session is present — middleware already redirects
 * page navigation, but API routes need to fail explicitly.
 */
export async function requireUser(): Promise<{ id: string; email: string | null }> {
  const sb = await getSupabaseRSC();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user) throw new UnauthorizedError();
  return { id: user.id, email: user.email ?? null };
}
