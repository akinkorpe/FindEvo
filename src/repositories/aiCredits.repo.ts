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

export const RATE_LIMITS = {
  score_post: { window: "day" as const, max: 100 },
  approach_guide: { window: "day" as const, max: 20 },
  analyze_site: { window: "month" as const, max: 5 },
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
