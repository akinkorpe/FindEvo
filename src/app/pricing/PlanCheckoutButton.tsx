"use client";

// Client-side CTA on the pricing cards. Behaviour:
//   - signed-out user → /signin (LS checkout requires us to know who they are)
//   - signed-in + sellable plan → POST /api/checkout/lemonsqueezy → redirect
//   - plan with no variant configured → disabled "Coming soon"
//
// The auth check is a single GET to /api/subscription on mount. That endpoint
// is cheap (returns the user's plan) and already returns 401 for guests, so
// it doubles as our "are you logged in" probe without a second route.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/lib/plans";

interface Props {
  plan: PlanKey;
  /**
   * Whether a Lemon Squeezy variant ID is configured for this plan. If false,
   * we render a disabled "Coming soon" button — the only thing the user can
   * do is wait for us to wire it up.
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

  async function handleClick() {
    if (auth === "guest") {
      // Send them through signin with a hint to come back here. Signin
      // already handles the next-url param — fall back to /pricing if not.
      router.push(`/signin?next=${encodeURIComponent("/pricing")}`);
      return;
    }
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
      setError(err instanceof Error ? err.message : "Checkout failed.");
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
