import { PLANS, type PlanKey } from "./plans";
import { trackEvent } from "./posthog";

// Shape of the `planLimit` / `rateLimit` payload our API returns on 429.
// Re-declared client-side to avoid pulling server-only code into the bundle.
interface LimitMeta {
  plan?: PlanKey;
  upgradeTo?: PlanKey | null;
  max?: number;
  used?: number;
  window?: "day" | "month";
  kind?: string;
  limit?: string;
}

interface PlanLimitPayload {
  error?: string;
  planLimit?: LimitMeta;
  rateLimit?: LimitMeta;
}

// Beta mode is on until paid plans launch. While it's on the upgrade CTA is
// suppressed everywhere — the message tells the user when their limit resets
// instead, since they can't actually upgrade today.
//
// Keep in sync with the same flag in src/app/pricing/PlanCheckoutButton.tsx.
const BETA_MODE = true;

/**
 * Build a user-facing message from a 429 response body. Falls back to the
 * server's `error` string if the payload doesn't carry plan metadata.
 *
 * Beta mode: tell the user what reset window they're waiting on. Once paid
 * plans launch (BETA_MODE = false) the message switches to an upgrade CTA.
 */
export function formatPlanLimit(payload: PlanLimitPayload): string {
  const meta = payload.planLimit ?? payload.rateLimit;
  if (!meta || meta.max === undefined) {
    return payload.error ?? "You've hit a usage limit on your current plan.";
  }

  // Analytics: emit a single event whenever the user actually saw a
  // plan-limit message. Placed here so we don't have to dust four
  // PowerFeedClient callsites — every 429 surface goes through this fn.
  trackEvent("plan_limit_hit", {
    plan: meta.plan,
    limit_kind: meta.kind ?? meta.limit,
    window: meta.window,
    used: meta.used,
    max: meta.max,
  });

  const currentPlanName = meta.plan ? PLANS[meta.plan].name : "your current plan";
  const base = `You've hit the ${currentPlanName} limit (${meta.used ?? meta.max}/${meta.max}${
    meta.window ? ` per ${meta.window}` : ""
  }).`;

  if (BETA_MODE) {
    // No upgrade path during the beta. Give the user a useful "wait until"
    // hint based on the window (day → midnight UTC, month → 1st of next).
    const reset =
      meta.window === "day"
        ? " Resets at midnight UTC."
        : meta.window === "month"
          ? " Resets on the 1st of next month."
          : "";
    return base + reset;
  }

  // Paid-mode path: surface the next tier and the concrete cap it unlocks.
  if (!meta.upgradeTo) return base;
  const upgradePlan = PLANS[meta.upgradeTo];

  const kindToLimitKey: Record<string, keyof typeof upgradePlan.limits> = {
    score_post: "post_score_daily",
    approach_guide: "approach_guide_daily",
    analyze_site: "site_analysis_monthly",
    subreddits: "subreddits",
  };
  const lookup = meta.kind ?? meta.limit;
  const limitKey = lookup ? kindToLimitKey[lookup] : undefined;
  const upgradedCap =
    limitKey !== undefined ? upgradePlan.limits[limitKey] : undefined;

  const upgrade =
    typeof upgradedCap === "number"
      ? ` Upgrade to ${upgradePlan.name} for ${upgradedCap}${
          meta.window ? `/${meta.window}` : ""
        }.`
      : ` Upgrade to ${upgradePlan.name} for more headroom.`;

  return base + upgrade;
}
