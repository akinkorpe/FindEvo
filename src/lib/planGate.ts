// Capacity-style plan gating that doesn't fit the daily/monthly AI-credit
// pattern (subreddit count, rule history, etc).
//
// Time-windowed limits live in aiCredits.repo (checkRateLimit) because they
// reuse the existing usage table. This file is for "is this user allowed to
// do X right now" checks that need a live count.

import { getActivePlan } from "@/repositories/subscriptions.repo";
import {
  DEFAULT_PLAN,
  getLimit,
  nextPlan,
  type PlanKey,
  type PlanLimits,
} from "./plans";
import { getSupabaseServer } from "./supabase";

export interface PlanCapacityStatus {
  /** Which limit was checked, e.g. "subreddits". */
  limit: keyof PlanLimits;
  used: number;
  max: number;
  remaining: number;
  allowed: boolean;
  plan: PlanKey;
  upgradeTo: PlanKey | null;
}

export class PlanLimitError extends Error {
  status: PlanCapacityStatus;
  constructor(status: PlanCapacityStatus) {
    super(
      `Plan limit reached for ${String(status.limit)}: ${status.used}/${
        status.max
      } on ${status.plan}`,
    );
    this.name = "PlanLimitError";
    this.status = status;
  }
}

/**
 * Checks whether `userId`'s product has room for one more tracked subreddit.
 * Returns the status object regardless — caller decides whether to throw.
 */
export async function checkSubredditCapacity(
  userId: string | undefined,
  productId: string,
): Promise<PlanCapacityStatus> {
  const plan = userId ? await getActivePlan(userId) : DEFAULT_PLAN;
  const max = getLimit(plan, "subreddits") as number;

  // Use the service-role client so we get an accurate count regardless of
  // RLS — the route already authenticated the user above this call.
  const { count, error } = await getSupabaseServer()
    .from("subreddits")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw error;

  const used = count ?? 0;
  const remaining = Math.max(0, max - used);
  return {
    limit: "subreddits",
    used,
    max,
    remaining,
    allowed: remaining >= 1,
    plan,
    upgradeTo: nextPlan(plan),
  };
}

export async function assertSubredditCapacity(
  userId: string | undefined,
  productId: string,
): Promise<void> {
  const status = await checkSubredditCapacity(userId, productId);
  if (!status.allowed) throw new PlanLimitError(status);
}
