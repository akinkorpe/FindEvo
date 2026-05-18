import { getSupabaseServer } from "@/lib/supabase";
import { DEFAULT_PLAN, type PlanKey } from "@/lib/plans";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export interface Subscription {
  userId: string;
  plan: PlanKey;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  provider: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
}

interface SubscriptionRow {
  user_id: string;
  plan: PlanKey;
  status: SubscriptionStatus;
  current_period_end: string | null;
  provider: string | null;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
}

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
    providerCustomerId: row.provider_customer_id,
  };
}

/**
 * Returns the user's current plan. Falls back to Starter when:
 *   - no row exists,
 *   - the table itself is missing (migration not yet applied),
 *   - the subscription is no longer active.
 *
 * Never throws — gating logic should always have *some* plan to compare
 * against. The DB call is wrapped in try/catch specifically so a missing
 * subscriptions table never takes the whole API down before the migration
 * has been run in production.
 */
export async function getActivePlan(userId: string): Promise<PlanKey> {
  try {
    const { data, error } = await getSupabaseServer()
      .from("subscriptions")
      .select(
        "user_id, plan, status, current_period_end, provider, provider_subscription_id, provider_customer_id",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return DEFAULT_PLAN;
    const sub = mapSubscription(data as SubscriptionRow);
    // Past-due / cancelled / expired all collapse to the free starter tier.
    // Trialing is treated as active so the user gets full access during a
    // trial period; Lemon Squeezy expires the trial by flipping status.
    if (sub.status === "active" || sub.status === "trialing") return sub.plan;
    return DEFAULT_PLAN;
  } catch {
    return DEFAULT_PLAN;
  }
}

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  try {
    const { data, error } = await getSupabaseServer()
      .from("subscriptions")
      .select(
        "user_id, plan, status, current_period_end, provider, provider_subscription_id, provider_customer_id",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return mapSubscription(data as SubscriptionRow);
  } catch {
    return null;
  }
}

export interface UpsertSubscriptionInput {
  userId: string;
  plan: PlanKey;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  provider?: string | null;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
}

export async function upsertSubscription(
  input: UpsertSubscriptionInput,
): Promise<void> {
  const { error } = await getSupabaseServer()
    .from("subscriptions")
    .upsert(
      {
        user_id: input.userId,
        plan: input.plan,
        status: input.status,
        current_period_end: input.currentPeriodEnd ?? null,
        provider: input.provider ?? null,
        provider_subscription_id: input.providerSubscriptionId ?? null,
        provider_customer_id: input.providerCustomerId ?? null,
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

export async function updateSubscriptionStatus(
  providerSubscriptionId: string,
  status: SubscriptionStatus,
  currentPeriodEnd?: string | null,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (currentPeriodEnd !== undefined) {
    patch.current_period_end = currentPeriodEnd;
  }
  const { error } = await getSupabaseServer()
    .from("subscriptions")
    .update(patch)
    .eq("provider_subscription_id", providerSubscriptionId);
  if (error) throw error;
}
