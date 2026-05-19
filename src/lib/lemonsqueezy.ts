// Lemon Squeezy integration helpers.
//
// Wraps the official SDK so route handlers don't each have to know about
// API-key wiring, variant→plan mapping, or webhook signature verification.
//
// Why a single module: checkout and webhook routes share the same env-driven
// "which variant is which plan" map. Putting that logic in two places is how
// they silently drift apart.

import crypto from "node:crypto";
import {
  createCheckout,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";
import type { PlanKey } from "./plans";

let initialized = false;

/**
 * Lazy-init the SDK on first use. The SDK keeps its config in module-level
 * state, so calling setup() multiple times is fine — we just avoid the work
 * on cold paths that don't touch billing.
 *
 * Returns false when LEMONSQUEEZY_API_KEY is missing so routes can return
 * 503 instead of crashing. Local dev without billing keeps working.
 */
export function ensureLemonSqueezy(): boolean {
  if (initialized) return true;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return false;
  lemonSqueezySetup({ apiKey });
  initialized = true;
  return true;
}

export class LemonSqueezyNotConfiguredError extends Error {
  constructor() {
    super("Lemon Squeezy billing is not configured on this environment.");
    this.name = "LemonSqueezyNotConfiguredError";
  }
}

// ─── Variant ↔ plan mapping ──────────────────────────────────────────────
// Variants are looked up at call time (not module load) so deployments that
// add a new variant ID can pick it up after an env change + restart, without
// a code edit.

interface VariantEntry {
  variantId: string;
  plan: PlanKey;
  /** Helpful for logs / future yearly UI. */
  interval: "monthly" | "yearly";
}

function variantTable(): VariantEntry[] {
  const entries: VariantEntry[] = [];
  const push = (
    env: string | undefined,
    plan: PlanKey,
    interval: "monthly" | "yearly",
  ) => {
    if (env && env.trim()) {
      entries.push({ variantId: env.trim(), plan, interval });
    }
  };
  push(process.env.LEMONSQUEEZY_VARIANT_STARTER_MONTHLY, "starter", "monthly");
  push(process.env.LEMONSQUEEZY_VARIANT_STARTER_YEARLY, "starter", "yearly");
  push(process.env.LEMONSQUEEZY_VARIANT_GROWTH_MONTHLY, "growth", "monthly");
  push(process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY, "pro", "monthly");
  return entries;
}

/** Returns the variant ID configured for a plan's monthly variant, or null. */
export function variantIdForPlan(plan: PlanKey): string | null {
  const entry = variantTable().find(
    (v) => v.plan === plan && v.interval === "monthly",
  );
  return entry?.variantId ?? null;
}

/**
 * Reverse map for webhook handling. Returns null for variants we don't
 * recognise — the webhook then ignores the row rather than writing junk
 * (e.g. when a test variant is created in the LS console but not added
 * to env yet).
 */
export function planForVariantId(variantId: string | number): PlanKey | null {
  const id = String(variantId);
  return variantTable().find((v) => v.variantId === id)?.plan ?? null;
}

// ─── Webhook signature verification ──────────────────────────────────────

/**
 * Verify the `X-Signature` header on a Lemon Squeezy webhook. The signature
 * is an HMAC-SHA256 hex digest of the raw request body, keyed with the
 * webhook secret from LS settings.
 *
 * IMPORTANT: pass the *raw* body string, not the parsed JSON. Re-stringifying
 * a parsed object reorders keys and breaks the digest.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Length mismatch crashes timingSafeEqual; bail before we get there.
  if (expected.length !== signatureHeader.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signatureHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

// ─── Checkout ────────────────────────────────────────────────────────────

export interface CreateCheckoutInput {
  plan: PlanKey;
  userId: string;
  userEmail: string | null;
  /** Absolute URL the user lands on after a successful purchase. */
  redirectUrl: string;
}

export interface CreateCheckoutResult {
  url: string;
  checkoutId: string;
}

/**
 * Create a hosted Lemon Squeezy checkout for the given user/plan.
 *
 * `custom.user_id` is the bridge back to our DB — the webhook reads it from
 * `subscription_created` to know which row to upsert. Without it, we'd have
 * no reliable way to link an LS subscription to a Supabase user.
 */
export async function createPlanCheckout(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  if (!ensureLemonSqueezy()) throw new LemonSqueezyNotConfiguredError();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new LemonSqueezyNotConfiguredError();

  const variantId = variantIdForPlan(input.plan);
  if (!variantId) {
    throw new Error(`No Lemon Squeezy variant configured for plan "${input.plan}".`);
  }

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: input.userEmail ?? undefined,
      custom: { user_id: input.userId },
    },
    productOptions: {
      redirectUrl: input.redirectUrl,
    },
    // Mirror the store's mode automatically. While LEMONSQUEEZY_API_KEY is
    // a test key the store is in test mode and checkouts free-ride; once we
    // swap to a live key the same code creates live checkouts.
  });

  if (error || !data) {
    throw new Error(
      `Lemon Squeezy createCheckout failed: ${error?.message ?? "unknown error"}`,
    );
  }

  const url = data.data.attributes.url;
  const checkoutId = String(data.data.id);
  if (!url) throw new Error("Lemon Squeezy returned a checkout with no URL.");
  return { url, checkoutId };
}
