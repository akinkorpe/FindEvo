import { getSupabaseServer } from "@/lib/supabase";

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
  let q = getSupabaseServer().from("ai_credits").select("amount");
  q = productId ? q.eq("product_id", productId) : q.is("product_id", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).reduce(
    (acc: number, row: { amount: number }) => acc + row.amount,
    0,
  );
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
  const { data, error } = await getSupabaseServer()
    .from("ai_credits")
    .select("amount")
    .eq("product_id", productId)
    .eq("kind", kind)
    .gte("created_at", sinceIso);
  if (error) throw error;
  // Usage rows are stored with negative amounts (spend). Count absolute spend.
  return (data ?? []).reduce((acc: number, row: { amount: number }) => {
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

export const RATE_LIMITS = {
  score_post: { window: "day" as const, max: 10000 },
  approach_guide: { window: "day" as const, max: 2000 },
  analyze_site: { window: "month" as const, max: 500 },
};

export interface RateLimitStatus {
  kind: CreditKind;
  window: "day" | "month";
  max: number;
  used: number;
  remaining: number;
  allowed: boolean;
}

export async function checkRateLimit(
  productId: string,
  kind: CreditKind,
  needed = 1,
): Promise<RateLimitStatus> {
  const cfg = RATE_LIMITS[kind];
  const used =
    cfg.window === "day"
      ? await dailyUsage(productId, kind)
      : await monthlyUsage(productId, kind);
  const remaining = Math.max(0, cfg.max - used);
  return {
    kind,
    window: cfg.window,
    max: cfg.max,
    used,
    remaining,
    allowed: remaining >= needed,
  };
}

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
