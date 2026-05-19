"use client";

// Shown on /dashboard when the URL carries ?upgraded=1, which is the
// redirect Lemon Squeezy sends users to after a successful checkout.
// Auto-dismisses after a few seconds; cleans the query param so a refresh
// doesn't re-trigger the toast.
//
// Standalone component (no global toast system) — billing is the only flow
// that needs this kind of confirmation today; adding a toast library just
// for one surface is overkill.

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/posthog";

const AUTO_DISMISS_MS = 6000;

export function UpgradeSuccessToast() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const upgraded = params.get("upgraded") === "1";
  const [visible, setVisible] = useState(upgraded);

  useEffect(() => {
    if (!upgraded) return;
    setVisible(true);
    // Fire here rather than at checkout-start so the funnel measures
    // *actual* paid completions, not abandoned redirects to LS.
    trackEvent("checkout_completed");

    // Strip the query param so a refresh doesn't show the toast again, and
    // back-nav from a deeper page lands on a clean dashboard URL.
    const next = new URLSearchParams(params.toString());
    next.delete("upgraded");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // params is a stable URLSearchParams snapshot per render; we only want
    // this to fire when `upgraded` flips true on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgraded]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-pop"
      role="status"
      aria-live="polite"
    >
      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-900">
          Welcome to FindEvo
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
          Your subscription is active. New limits unlock the moment your trial
          ends — until then, everything's already turned on.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="-mr-1 -mt-1 rounded p-1 text-emerald-700 hover:bg-emerald-100"
        aria-label="Dismiss"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
