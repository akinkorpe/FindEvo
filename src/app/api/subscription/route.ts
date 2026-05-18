import { NextResponse } from "next/server";
import { getActivePlan, getSubscription } from "@/repositories/subscriptions.repo";
import { getPlan, nextPlan } from "@/lib/plans";
import { requireUser, UnauthorizedError } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/subscription
//
// Returns the caller's plan + limits + status. Used by the upgrade banner
// and the pricing CTA. Always returns a plan (Starter when no row exists)
// so the frontend never has to special-case "no subscription".
export async function GET() {
  try {
    const user = await requireUser();
    const plan = await getActivePlan(user.id);
    const sub = await getSubscription(user.id);
    return NextResponse.json({
      ok: true,
      plan: getPlan(plan),
      status: sub?.status ?? "active",
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      upgradeTo: nextPlan(plan),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 401 },
      );
    }
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
