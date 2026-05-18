import { getSupabaseServer } from "@/lib/supabase";
import { DEFAULT_PLAN, getLimit, PLANS, type PlanKey } from "@/lib/plans";
import { getActivePlan } from "./subscriptions.repo";

export type CreditKind = "analyze_site" | "score_post" | "approach_guide";

export async function recordUsage(
  productId: string | null,
  kind: CreditKind,
  amount: number,
): Promise<void> {
  const { error } = await getSupabaseServer()
    .from("ai_credits")
    .insert({ product_id: productId, kind, amount });
  if (error) throw error;
}

export async function creditBalance(productId: string | null): Promise<number> {
  const sb = getSupabaseServer();
  // Use DB-level aggregation instead of fetching all rows
  const q = productId
    ? sb.from("ai_credits").select("amount.sum()").eq("product_id", productId)
    : sb.from("ai_credits").select("amount.sum()").is("product_id", null);
  const { data, error } = await q;
  if (!error && data?.[0] != null) {
    const row = data[0] as unknown as { sum: number | null };
    return row.sum ?? 0;
  }
  // Fallback to row-by-row sum if aggregation unsupported
  let qFallback = sb.from("ai_credits").select("amount");
  qFallback = productId
    ? qFallback.eq("product_id", productId)
    : qFallback.is("product_id", null);
  const { data: rows, error: rowsError } = await qFallback;
  if (rowsError) throw rowsError;
  return (rows ?? []).reduce((acc: number, row: { amount: number }) => acc + row.amount, 0);
}

function startOfDayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthUtc(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function usageSince(
  productId: string,
  kind: CreditKind,
  sinceIso: string,
): Promise<number> {
  // Fetch only negative spend rows and aggregate in DB
  const { data, error } = await getSupabaseServer()
    .from("ai_credits")
    .select("amount.sum()")
    .eq("product_id", productId)
    .eq("kind", kind)
    .gte("created_at", sinceIso)
    .lt("amount", 0);
  if (!error && data?.[0] != null) {
    const row = data[0] as unknown as { sum: number | null };
    return Math.abs(row.sum ?? 0);
  }
  // Fallback
  const { data: rows, error: rowsError } = await getSupabaseServer()
    .from("ai_credits")
    .select("amount")
    .eq("product_id", productId)
    .eq("kind", kind)
    .gte("created_at", sinceIso);
  if (rowsError) throw rowsError;
  return (rows ?? []).reduce((acc: number, row: { amount: number }) => {
    return row.amount < 0 ? acc + Math.abs(row.amount) : acc;
  }, 0);
}

export async function dailyUsage(
  productId: string,
  kind: CreditKind,
): Promise<number> {
  return usageSince(productId, kind, startOfDayUtc());
}

export async function monthlyUsage(
  productId: string,
  kind: CreditKind,
): Promise<number> {
  return usageSince(productId, kind, startOfMonthUtc());
}

// Each AI action has a fixed billing window — daily for hot paths (scoring,
// strategy) and monthly for the expensive site-analysis call. The numeric
// cap is plan-dependent and resolved from PLANS; the window itself is
// product-level configuration, not pricing.
const RATE_LIMIT_WINDOWS: Record<CreditKind, "day" | "month"> = {
  score_post: "day",
  approach_guide: "day",
  analyze_site: "month",
};

const LIMIT_KEY_BY_KIND: Record<
  CreditKind,
  "post_score_daily" | "approach_guide_daily" | "site_analysis_monthly"
> = {
  score_post: "post_score_daily",
  approach_guide: "approach_guide_daily",
  analyze_site: "site_analysis_monthly",
};

function maxForPlan(plan: PlanKey, kind: CreditKind): number {
  return getLimit(plan, LIMIT_KEY_BY_KIND[kind]);
}

/**
 * Back-compat export. Callers that haven't been migrated to plan-aware
 * checking still read these defaults — they correspond to the Starter
 * (free) tier. New callsites should use `checkRateLimit` with `userId`.
 */
export const RATE_LIMITS = {
  score_post: {
    window: RATE_LIMIT_WINDOWS.score_post,
    max: maxForPlan(DEFAULT_PLAN, "score_post"),
  },
  approach_guide: {
    window: RATE_LIMIT_WINDOWS.approach_guide,
    max: maxForPlan(DEFAULT_PLAN, "approach_guide"),
  },
  analyze_site: {
    window: RATE_LIMIT_WINDOWS.analyze_site,
    max: maxForPlan(DEFAULT_PLAN, "analyze_site"),
  },
} as const;

export interface RateLimitStatus {
  kind: CreditKind;
  window: "day" | "month";
  max: number;
  used: number;
  remaining: number;
  allowed: boolean;
  /** Which plan tier produced this limit — used by upgrade CTAs. */
  plan: PlanKey;
  /** Next tier up, or null if the user is already on Pro. */
  upgradeTo: PlanKey | null;
}

interface CheckRateLimitOpts {
  /** Authenticated user id. Drives plan lookup. When omitted, falls back to
   *  the Starter tier so unauth/legacy callsites still get sane limits. */
  userId?: string;
  needed?: number;
}

export async function checkRateLimit(
  productId: string,
  kind: CreditKind,
  optsOrNeeded: CheckRateLimitOpts | number = {},
): Promise<RateLimitStatus> {
  // Tolerate the old `checkRateLimit(productId, kind, needed)` signature
  // so we don't have to migrate every callsite in one go.
  const opts: CheckRateLimitOpts =
    typeof optsOrNeeded === "number" ? { needed: optsOrNeeded } : optsOrNeeded;
  const needed = opts.needed ?? 1;

  const plan = opts.userId
    ? await getActivePlan(opts.userId)
    : DEFAULT_PLAN;

  const window = RATE_LIMIT_WINDOWS[kind];
  const max = maxForPlan(plan, kind);
  const used =
    window === "day"
      ? await dailyUsage(productId, kind)
      : await monthlyUsage(productId, kind);
  const remaining = Math.max(0, max - used);

  // Compute the next tier's headline cap so the upgrade CTA can say
  // "Growth gives you 3× this." We pick from PLANS rather than recomputing
  // so future tier additions show up automatically.
  const upgradeTo =
    plan === "starter" ? "growth" : plan === "growth" ? "pro" : null;

  return {
    kind,
    window,
    max,
    used,
    remaining,
    allowed: remaining >= needed,
    plan,
    upgradeTo: upgradeTo as PlanKey | null,
  };
}

/**
 * Resolve the headline cap for a kind on a specific plan. Used by the
 * pricing page and upgrade banners to display "Growth: 150/day" without
 * having to call the live rate-limit endpoint.
 */
export function planCap(plan: PlanKey, kind: CreditKind): number {
  return maxForPlan(plan, kind);
}

// Re-export PLANS for callers that already import from this module — saves a
// second import line at every callsite.
export { PLANS };

export class RateLimitError extends Error {
  status: RateLimitStatus;
  constructor(status: RateLimitStatus) {
    super(
      `Rate limit reached for ${status.kind}: ${status.used}/${status.max} per ${status.window}`,
    );
    this.name = "RateLimitError";
    this.status = status;
  }
}
