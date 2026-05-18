import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { countAllStatuses, leadVelocity } from "@/repositories/leads.repo";
import { countForProduct, listForProduct } from "@/repositories/scoredPosts.repo";
import { getProduct } from "@/repositories/products.repo";
import { requireUser, UnauthorizedError } from "../_auth";

export const runtime = "nodejs";

// Match the feed's Hot/Warm Lead threshold so the dashboard count agrees with
// what the user sees in the Power Feed badges. Anything below 60 is Lukewarm
// or Cool — not what we want to call out as "high intent" on the hero card.
const HIGH_INTENT_THRESHOLD = 60;

function startOfTodayUtcIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function clampDays(raw: string | null): number {
  // 7D / 30D / 365 (YTD-ish — using 365 keeps the SQL simple and the chart
  // honest; true YTD would jump back to Jan 1 which is ugly mid-January).
  const n = Number(raw);
  if (!Number.isFinite(n)) return 7;
  return Math.min(365, Math.max(7, Math.round(n)));
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase not configured" },
      { status: 503 },
    );
  }
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "`productId` required" },
      { status: 400 },
    );
  }
  const velocityDays = clampDays(url.searchParams.get("velocityDays"));

  try {
    const user = await requireUser();
    const product = await getProduct(productId, user.id);
    if (!product) throw new Error("product not found");

    const todayIso = startOfTodayUtcIso();
    const weekAgoIso = sevenDaysAgoIso();

    const [
      highIntentTotal,
      highIntentToday,
      statusCountsAll,
      statusCountsWeek,
      velocity,
      feed,
    ] = await Promise.all([
      countForProduct(productId, { minScore: HIGH_INTENT_THRESHOLD }),
      countForProduct(productId, {
        minScore: HIGH_INTENT_THRESHOLD,
        sinceIso: todayIso,
      }),
      countAllStatuses(productId),
      countAllStatuses(productId, { sinceIso: weekAgoIso }),
      leadVelocity(productId, velocityDays),
      listForProduct(productId, { limit: 3 }),
    ]);

    const activePipelineAll = statusCountsAll["active_pipeline"] ?? 0;
    const engagedAll = statusCountsAll["engaged"] ?? 0;
    const convertedAll = statusCountsAll["converted"] ?? 0;
    const activeThreads = activePipelineAll + engagedAll;
    const contactedAll = convertedAll + activePipelineAll + engagedAll;
    const conversionRate =
      contactedAll > 0
        ? Number(((convertedAll / contactedAll) * 100).toFixed(1))
        : 0;

    // Same denominator pattern for the last 7 days so "this week" actually
    // reflects this-week conversion, not a copy of the all-time number.
    const activePipelineWeek = statusCountsWeek["active_pipeline"] ?? 0;
    const engagedWeek = statusCountsWeek["engaged"] ?? 0;
    const convertedWeek = statusCountsWeek["converted"] ?? 0;
    const contactedWeek = convertedWeek + activePipelineWeek + engagedWeek;
    const conversionRateWeek =
      contactedWeek > 0
        ? Number(((convertedWeek / contactedWeek) * 100).toFixed(1))
        : 0;

    const intelligenceFeed = feed.slice(0, 3).map((f) => ({
      id: f.id,
      priority:
        f.intentScore >= 85
          ? "high"
          : f.intentScore >= 60
            ? "opportunity"
            : "routine",
      title:
        f.intentScore >= 85
          ? `High-intent lead in r/${f.post.subreddit}`
          : f.intentScore >= 60
            ? `Opportunity in r/${f.post.subreddit}`
            : `Routine: ${f.post.title.slice(0, 60)}`,
      body: f.reason || f.post.title,
      cta: f.intentScore >= 85 ? "Draft Reply" : "View Context",
      contextUrl: `/feed?focus=${encodeURIComponent(f.id)}`,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({
      ok: true,
      product,
      metrics: {
        highIntentCount: highIntentTotal,
        highIntentToday,
        activeThreads,
        // Lead-velocity-derived weekly delta in active threads. We don't store
        // historical snapshots of `engaged + active_pipeline`, so the closest
        // honest signal is "new qualified leads in the last 7 days".
        newLeadsLast7Days: velocity.reduce((acc, v) => acc + v.count, 0),
        conversionRate,
        conversionRateWeek,
      },
      velocity,
      velocityDays,
      intelligenceFeed,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
