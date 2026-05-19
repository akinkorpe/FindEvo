"use client";

// Thin banner shown above the app shell when the user's Lemon Squeezy
// subscription is in a non-active state we should warn about (past_due,
// cancelled with a still-valid period). We pull status from /api/subscription
// so this component has no props — it works anywhere it's mounted.
//
// Deliberately minimal: no email-the-user, no "update card" flow yet. Just
// surface the state so the user knows why their plan might quietly downgrade.

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubscriptionResponse {
  ok: boolean;
  status?: "active" | "trialing" | "past_due" | "cancelled" | "expired";
  plan?: { name: string };
  currentPeriodEnd?: string | null;
}

export function PastDueBanner() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        // Banner is best-effort — never block rendering on a failed probe.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data?.ok) return null;
  if (data.status === "active" || data.status === "trialing") return null;

  // Map status → message. Past-due is the loudest because the user can
  // actually fix it; cancelled is informational until the period ends.
  let message: string;
  let tone: "warning" | "danger" = "warning";
  if (data.status === "past_due") {
    message =
      "Your last payment didn't go through. Update your card to keep your plan active.";
    tone = "danger";
  } else if (data.status === "cancelled") {
    const ends = data.currentPeriodEnd
      ? new Date(data.currentPeriodEnd).toLocaleDateString()
      : "the end of the period";
    message = `Your plan is cancelled and will end on ${ends}.`;
  } else {
    message = "Your plan has expired. Resubscribe to restore higher limits.";
  }

  return (
    <div
      className={
        "border-b px-4 py-2 text-sm sm:px-6 " +
        (tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-900")
      }
      role="status"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <span>{message}</span>
        <Link
          href="/pricing"
          className="shrink-0 rounded-lg border border-current/30 px-3 py-1 text-xs font-medium hover:bg-white/40"
        >
          Manage plan
        </Link>
      </div>
    </div>
  );
}
