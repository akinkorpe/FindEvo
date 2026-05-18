import { PLANS, type PlanKey } from "./plans";

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

/**
 * Build a user-facing message from a 429 response body. Falls back to the
 * server's `error` string if the payload doesn't carry plan metadata.
 *
 * Goal: never just say "Rate limit reached." Say what limit, on what plan,
 * and what upgrading would unlock — that's the whole point of having plans.
 */
export function formatPlanLimit(payload: PlanLimitPayload): string {
  const meta = payload.planLimit ?? payload.rateLimit;
  if (!meta || !meta.upgradeTo || meta.max === undefined) {
    return payload.error ?? "You've hit a usage limit on your current plan.";
  }

  const upgradeKey = meta.upgradeTo;
  const upgradePlan = PLANS[upgradeKey];
  const currentPlanName = meta.plan ? PLANS[meta.plan].name : "your current plan";

  // Try to pull the upgraded cap from PLANS so we can quote a real number
  // (e.g. "Growth gives you 150/day"). We map the kind/limit field back to
  // the PlanLimits keys.
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

  const base = `You've hit the ${currentPlanName} limit (${meta.used ?? meta.max}/${meta.max}${
    meta.window ? ` per ${meta.window}` : ""
  }).`;
  const upgrade =
    typeof upgradedCap === "number"
      ? ` Upgrade to ${upgradePlan.name} for ${upgradedCap}${
          meta.window ? `/${meta.window}` : ""
        }.`
      : ` Upgrade to ${upgradePlan.name} for more headroom.`;

  return base + upgrade;
}
