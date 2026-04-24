import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  countAll,
  countByStatus,
  leadVelocity,
  listLeads,
} from "@/repositories/leads.repo";
import { listForProduct } from "@/repositories/scoredPosts.repo";
import { listTargets } from "@/repositories/subreddits.repo";
import { creditBalance } from "@/repositories/aiCredits.repo";
import { getProduct } from "@/repositories/products.repo";

export const runtime = "nodejs";

const CREDIT_GRANT = 10_000;

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

  try {
    const product = await getProduct(productId);
    if (!product) throw new Error("product not found");

    const [
      highIntentCount,
      totalLeads,
      activePipeline,
      engaged,
      converted,
      velocity,
      feed,
      targets,
      usageBalance,
      recentLeads,
    ] = await Promise.all([
      // High-intent = intent_score >= 70
      listForProduct(productId, { minScore: 70, limit: 1000 }).then((l) => l.length),
      countAll(productId),
      countByStatus(productId, "active_pipeline"),
      countByStatus(productId, "engaged"),
      countByStatus(productId, "converted"),
      leadVelocity(productId, 7),
      listForProduct(productId, { limit: 3 }),
      listTargets(productId),
      creditBalance(productId),
      listLeads(productId, { limit: 5 }),
    ]);

    const activeThreads = activePipeline + engaged;
    const contactedish = converted + activePipeline + engaged;
    const conversionRate =
      contactedish > 0 ? Number(((converted / contactedish) * 100).toFixed(1)) : 0;
    const creditsLeft = Math.max(0, CREDIT_GRANT + usageBalance);

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

    const targetCount = targets.length || 1;
    const highPriority = targets.filter((t) => t.priority === "high").length;
    const penetration = Math.min(100, Math.round((highPriority / targetCount) * 100) || 0);

    const campaignHealth = [
      {
        label: "Subreddit Coverage",
        percent: Math.max(10, penetration || 30),
        note: targets.length ? `${targets.length} target subreddits` : "No targets yet",
      },
      {
        label: "Reply Engagement",
        percent:
          totalLeads > 0
            ? Math.round(((engaged + activePipeline) / totalLeads) * 100)
            : 0,
        note:
          engaged + activePipeline > 0
            ? `${engaged + activePipeline} threads in motion`
            : "No engaged threads yet",
      },
      {
        label: "Pipeline Flow",
        percent:
          totalLeads > 0
            ? Math.round((activePipeline / Math.max(1, totalLeads - converted)) * 100)
            : 0,
        note: activePipeline
          ? `${activePipeline} leads moving forward`
          : "No active pipeline yet",
      },
    ];

    return NextResponse.json({
      ok: true,
      product,
      metrics: {
        highIntentCount,
        totalLeads,
        activeThreads,
        conversionRate,
        aiCredits: creditsLeft,
        aiCreditsMax: CREDIT_GRANT,
      },
      velocity,
      intelligenceFeed,
      campaignHealth,
      recentLeads,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
