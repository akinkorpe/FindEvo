// POST /api/checkout/lemonsqueezy
//
// Creates a hosted Lemon Squeezy checkout for the authenticated user and
// returns the redirect URL. Frontend should `window.location.href = url`.
//
// The user's id is embedded in `checkout_data.custom.user_id` so the
// `subscription_created` webhook can link the LS subscription back to our
// Supabase user row.

import { NextResponse } from "next/server";
import {
  LemonSqueezyNotConfiguredError,
  createPlanCheckout,
} from "@/lib/lemonsqueezy";
import { PLANS, type PlanKey } from "@/lib/plans";
import { requireUser, UnauthorizedError } from "../../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && value in PLANS;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = (await request.json().catch(() => ({}))) as {
      plan?: unknown;
    };
    const plan: PlanKey = isPlanKey(body.plan) ? body.plan : "starter";

    // Build redirect_url from NEXT_PUBLIC_APP_URL so prod and dev point at
    // their own origin. Falls back to the request origin when the env var is
    // missing — useful for preview deploys.
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      new URL(request.url).origin;

    const { url } = await createPlanCheckout({
      plan,
      userId: user.id,
      userEmail: user.email,
      redirectUrl: `${origin}/dashboard?upgraded=1`,
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 401 },
      );
    }
    if (err instanceof LemonSqueezyNotConfiguredError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
