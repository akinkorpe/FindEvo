// POST /api/webhooks/lemonsqueezy
//
// Lemon Squeezy posts subscription lifecycle events here. We verify the
// HMAC-SHA256 signature against the raw body, look up which plan the
// purchased variant maps to, and upsert the user's subscription row.
//
// Idempotency: LS retries failed deliveries, sometimes more than once.
// `upsertSubscription` is keyed on user_id, so re-running the same event
// just rewrites the same fields — no duplicate rows, no double-billing
// side effects on our side.

import { NextResponse } from "next/server";
import {
  planForVariantId,
  verifyWebhookSignature,
} from "@/lib/lemonsqueezy";
import {
  updateSubscriptionStatus,
  upsertSubscription,
  type SubscriptionStatus,
} from "@/repositories/subscriptions.repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Event payload shape ─────────────────────────────────────────────────
// LS sends JSON:API documents. We only read what we need; everything else
// stays untyped on purpose — narrowing the whole payload here would couple
// us to fields we don't care about (and that LS may rename).

type LsEventName =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered";

interface SubscriptionAttributes {
  status?: string;
  variant_id?: number | string;
  customer_id?: number | string;
  renews_at?: string | null;
  ends_at?: string | null;
}

interface LsWebhookPayload {
  meta?: {
    event_name?: LsEventName;
    custom_data?: { user_id?: string };
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: SubscriptionAttributes;
  };
}

// LS subscription.status values we care about. Anything else (paused,
// unpaused, on_trial after grace, etc.) we normalise to a sensible bucket.
function mapStatus(lsStatus: string | undefined): SubscriptionStatus {
  switch (lsStatus) {
    case "active":
      return "active";
    case "on_trial":
      return "trialing";
    case "past_due":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "expired":
    case "unpaid":
      return "expired";
    default:
      return "active";
  }
}

export async function POST(request: Request) {
  // Signature is computed over the *raw* body. Parse manually after verify.
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { ok: false, error: "invalid signature" },
      { status: 401 },
    );
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LsWebhookPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 },
    );
  }

  const eventName = payload.meta?.event_name;
  const attrs = payload.data?.attributes ?? {};
  const providerSubscriptionId = payload.data?.id
    ? String(payload.data.id)
    : null;
  const userId = payload.meta?.custom_data?.user_id;

  // Some events don't carry a subscription id (e.g. order-only events we
  // don't subscribe to). Skip them quietly with a 200 so LS stops retrying.
  if (!eventName || !providerSubscriptionId) {
    return NextResponse.json({ ok: true, skipped: "no event id" });
  }

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_payment_success":
      case "subscription_payment_recovered": {
        if (!userId) {
          // Should never happen: we set custom_data.user_id at checkout.
          // 200 so LS gives up retrying — there's nothing it can do.
          return NextResponse.json({
            ok: true,
            skipped: "missing user_id in custom_data",
          });
        }
        const plan = attrs.variant_id
          ? planForVariantId(attrs.variant_id)
          : null;
        if (!plan) {
          // Unknown variant — likely a test/sandbox variant that isn't in
          // our env yet. Don't write a row we'd later need to clean up.
          return NextResponse.json({
            ok: true,
            skipped: `unknown variant ${attrs.variant_id}`,
          });
        }
        await upsertSubscription({
          userId,
          plan,
          status: mapStatus(attrs.status),
          currentPeriodEnd: attrs.renews_at ?? null,
          provider: "lemonsqueezy",
          providerSubscriptionId,
          providerCustomerId: attrs.customer_id
            ? String(attrs.customer_id)
            : null,
        });
        break;
      }

      case "subscription_cancelled":
        // LS keeps cancelled subs active until ends_at; we mirror that by
        // updating status but leaving the plan in place so the user gets
        // what they paid for through the period.
        await updateSubscriptionStatus(
          providerSubscriptionId,
          "cancelled",
          attrs.ends_at ?? attrs.renews_at ?? null,
        );
        break;

      case "subscription_expired":
        await updateSubscriptionStatus(
          providerSubscriptionId,
          "expired",
          attrs.ends_at ?? null,
        );
        break;

      case "subscription_payment_failed":
        await updateSubscriptionStatus(providerSubscriptionId, "past_due");
        break;

      case "subscription_paused":
        await updateSubscriptionStatus(providerSubscriptionId, "past_due");
        break;

      case "subscription_unpaused":
        await updateSubscriptionStatus(providerSubscriptionId, "active");
        break;

      default:
        // Future-proof: unknown but signature-valid events return 200 so LS
        // doesn't hammer us with retries we'll never satisfy.
        return NextResponse.json({ ok: true, skipped: eventName });
    }

    return NextResponse.json({ ok: true, event: eventName });
  } catch (err) {
    // Returning 5xx makes LS retry the delivery (up to 3 days with backoff).
    // That's what we want for transient DB errors.
    const message = err instanceof Error ? err.message : "webhook handler failed";
    console.error("[lemonsqueezy webhook]", eventName, message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
