// Plan definitions for FindEvo subscriptions.
//
// Every limit shows up in two places:
//   1. As a hard quota the API enforces (planGate / aiCredits.checkRateLimit).
//   2. As copy on the /pricing page.
// Keep this file as the single source of truth so a marketing-page edit
// never silently disagrees with what the API actually enforces.

export type PlanKey = "starter" | "growth" | "pro";

export interface PlanLimits {
  /** Maximum tracked subreddits per product. */
  subreddits: number;
  /** Per-day intent-score calls (`/api/score-posts`, `/api/fetch-posts`). */
  post_score_daily: number;
  /** Per-day approach guide generations (`/api/approach-guide`). */
  approach_guide_daily: number;
  /** Per-month site analyses (`/api/analyze-site`). */
  site_analysis_monthly: number;
  /** Can the user export leads to CSV? */
  lead_export: boolean;
  /** Can the user see subreddit rule history beyond the latest snapshot? */
  rule_history: boolean;
}

export interface Plan {
  key: PlanKey;
  name: string;
  /** Monthly price in USD. */
  priceUsd: number;
  /** Short marketing tagline. */
  tagline: string;
  limits: PlanLimits;
}

export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    key: "starter",
    name: "Starter",
    priceUsd: 19,
    tagline: "For solo founders validating their first niche.",
    limits: {
      subreddits: 3,
      post_score_daily: 50,
      approach_guide_daily: 5,
      site_analysis_monthly: 1,
      lead_export: false,
      rule_history: false,
    },
  },
  growth: {
    key: "growth",
    name: "Growth",
    priceUsd: 39,
    tagline: "When one niche is working and you want to scale.",
    limits: {
      subreddits: 10,
      post_score_daily: 150,
      approach_guide_daily: 15,
      site_analysis_monthly: 3,
      lead_export: true,
      rule_history: true,
    },
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceUsd: 69,
    tagline: "Agencies and operators running multiple products.",
    limits: {
      // 999 is effectively unlimited; we keep a number rather than null so
      // every callsite can do the same `used < max` comparison.
      subreddits: 999,
      post_score_daily: 500,
      approach_guide_daily: 50,
      site_analysis_monthly: 10,
      lead_export: true,
      rule_history: true,
    },
  },
};

/** Default plan when a user has no active subscription row. */
export const DEFAULT_PLAN: PlanKey = "starter";

export function getPlan(key: PlanKey | null | undefined): Plan {
  return PLANS[key ?? DEFAULT_PLAN];
}

export function getLimit<K extends keyof PlanLimits>(
  key: PlanKey | null | undefined,
  limit: K,
): PlanLimits[K] {
  return getPlan(key).limits[limit];
}

/** The next tier up — used to render "Upgrade to X" CTAs. */
export function nextPlan(current: PlanKey): PlanKey | null {
  if (current === "starter") return "growth";
  if (current === "growth") return "pro";
  return null;
}
