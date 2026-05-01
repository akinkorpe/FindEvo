import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/feed", "/leads", "/settings"];
const AUTH_PAGES = ["/signin", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createMiddlewareSupabase(
    () => request.cookies.getAll(),
    (cookiesToSet) => {
      for (const { name, value, options } of cookiesToSet) {
        request.cookies.set(name, value);
        response.cookies.set(name, value, options);
      }
    },
  );

  // Refreshes the session cookie if it's near expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  if (user && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and Next internals. Run on everything else so
     * the session cookie is refreshed on every navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
  ],
};
