"use client";

// CTA on the pricing cards.
//
// Beta-mode behaviour (current): nobody is sent to Lemon Squeezy. Every
// account gets the Starter plan for free during the beta — so guests see
// "Start free" → /signin, and signed-in users see "Current plan" disabled.
//
// The checkout API route and webhook handler are still live; we just don't
// surface a CTA that hits them. Flipping the beta switch off later means
// turning `BETA_MODE` to false here (and updating the marketing copy on
// /pricing).
//
// Plans without a variant ID configured render "Coming soon" regardless of
// beta mode — that's the Growth/Pro state until those products exist in LS.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/lib/plans";
import { trackEvent } from "@/lib/posthog";

// Beta mode is on until paid plans launch. When this flips to false the
// signed-in CTA goes back to creating a real checkout.
const BETA_MODE = true;

interface Props {
  plan: PlanKey;
  /**
   * Whether a Lemon Squeezy variant ID is configured for this plan. False
   * → render disabled "Coming soon". Independent of beta mode.
   */
  sellable: boolean;
  /** Visual variant — primary (highlighted card) vs ghost (other cards). */
  variant: "primary" | "ghost";
}

type AuthState = "unknown" | "guest" | "user";

export function PlanCheckoutButton({ plan, sellable, variant }: Props) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription", { credentials: "include" })
      .then((r) => {
        if (cancelled) return;
        setAuth(r.ok ? "user" : "guest");
      })
      .catch(() => {
        if (!cancelled) setAuth("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sellable) {
    return (
      <button
        type="button"
        disabled
        className={`${classes(variant)} cursor-not-allowed opacity-60`}
      >
        Coming soon
      </button>
    );
  }

  // Beta path: every account is on Starter for free, so signed-in users
  // see a passive "Current plan" state and guests get pushed to signup.
  if (BETA_MODE) {
    if (auth === "user") {
      return (
        <button
          type="button"
          disabled
          className={`${classes(variant)} cursor-default opacity-70`}
        >
          Current plan
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          trackEvent("pricing_cta_clicked", { plan, cta: "start_free" });
          router.push("/signin");
        }}
        disabled={auth === "unknown"}
        className={classes(variant)}
      >
        Start free
        <ArrowIcon className="ml-1 h-4 w-4" />
      </button>
    );
  }

  async function handleClick() {
    if (auth === "guest") {
      trackEvent("pricing_cta_clicked", { plan, cta: "signin_required" });
      router.push(`/signin?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    trackEvent("checkout_started", { plan });
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/lemonsqueezy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed.";
      trackEvent("checkout_failed", { plan, reason: msg });
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || auth === "unknown"}
        className={`${classes(variant)} ${busy ? "opacity-70" : ""}`}
      >
        {busy ? "Redirecting…" : auth === "guest" ? "Start free" : "Upgrade"}
        <ArrowIcon className="ml-1 h-4 w-4" />
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function classes(variant: "primary" | "ghost") {
  const base =
    "mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition";
  if (variant === "primary") {
    return `${base} bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-900`;
  }
  return `${base} border border-ink-200 bg-surface text-ink-900 hover:border-ink-300 hover:bg-surface-muted`;
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
