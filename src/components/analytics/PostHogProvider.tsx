"use client";

// Mounts once at the root layout. Responsibilities:
//   1. Initialize PostHog (idempotent — won't double-init on remount).
//   2. Identify the signed-in user when the auth session resolves, and
//      reset the PostHog identity on sign-out so two users sharing a
//      browser don't get fused into one PostHog person.
//   3. Send a $pageview on every client-side navigation (App Router
//      doesn't fire one for you).
//
// All work is wrapped in safe() inside lib/posthog, so a missing env key
// or a network blip never bubbles up as a UI error.

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  identifyUser,
  initPostHog,
  resetUser,
  trackPageview,
} from "@/lib/posthog";
import { getSupabaseBrowser } from "@/lib/supabase";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PostHogBootstrap />
      {children}
    </>
  );
}

function PostHogBootstrap() {
  const pathname = usePathname();
  const params = useSearchParams();
  const lastIdentified = useRef<string | null>(null);

  // Init once on first render. The init helper short-circuits on repeat
  // calls, so StrictMode double-effects are fine.
  useEffect(() => {
    initPostHog();
  }, []);

  // Identify on session presence, reset on sign-out. We subscribe to the
  // auth state stream rather than poll because Supabase fires the
  // INITIAL_SESSION event on mount, which covers cold loads.
  useEffect(() => {
    const sb = getSupabaseBrowser();
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        if (lastIdentified.current === session.user.id) return;
        lastIdentified.current = session.user.id;
        identifyUser(session.user.id, {
          email: session.user.email,
          // Provider tells us how they signed in (google vs. email).
          provider: session.user.app_metadata?.provider ?? "email",
        });
      } else if (event === "SIGNED_OUT") {
        lastIdentified.current = null;
        resetUser();
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Pageview on every client nav. App Router doesn't emit one — pathname
  // changes are the canonical "the page changed" signal.
  useEffect(() => {
    if (!pathname) return;
    const url =
      pathname + (params?.toString() ? `?${params.toString()}` : "");
    trackPageview(url);
  }, [pathname, params]);

  return null;
}
