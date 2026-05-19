"use client";

// PostHog client-side helpers.
//
// Why a thin wrapper instead of using posthog-js directly everywhere:
//   - we only want events in production (NEXT_PUBLIC_POSTHOG_KEY is unset
//     locally → every call no-ops)
//   - identify/capture should never throw; analytics is a "best effort"
//     side channel and must not break user-visible flows
//   - one place to apply privacy defaults (PII masking on session replay)

import posthog from "posthog-js";

let initialized = false;

/**
 * Initialize PostHog once on the client. Safe to call repeatedly — it
 * short-circuits after the first run. No-op when the env key is missing,
 * which is how local dev stays quiet without per-callsite guards.
 */
export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    // We call posthog.capture("$pageview") manually from the provider so
    // App Router client navigations actually get tracked — autocapture
    // alone misses route changes in Next.
    capture_pageview: false,
    capture_pageleave: true,
    // Session replay is on but every form input and textarea is masked,
    // and password fields are masked by default. This keeps support
    // useful (we can see flows) without recording email addresses,
    // product survey answers, or anything else a user typed.
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    autocapture: {
      // Don't auto-capture text contents — only events. Cuts noise and
      // avoids recording arbitrary on-screen strings (e.g. lead bodies).
      capture_copied_text: false,
    },
    // Disable the "Welcome to PostHog" toolbar prompt on prod URLs.
    disable_session_recording: false,
    persistence: "localStorage+cookie",
    loaded: () => {
      initialized = true;
    },
  });
  initialized = true;
}

/** No-op if PostHog never initialized (local dev, env unset, etc.). */
function safe(fn: () => void): void {
  try {
    if (!initialized) return;
    fn();
  } catch {
    // Analytics errors must never bubble.
  }
}

export function trackPageview(url: string): void {
  safe(() => posthog.capture("$pageview", { $current_url: url }));
}

export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  safe(() => posthog.identify(userId, traits));
}

export function resetUser(): void {
  safe(() => posthog.reset());
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  safe(() => posthog.capture(name, properties));
}
